'use server'

import { sql } from '@vercel/postgres'
import { revalidatePath } from 'next/cache' // 🌟 BỔ SUNG: Dùng để ép Next.js xóa cache mượt mà

/**
 * LẤY DANH SÁCH BÌNH LUẬN CỦA ĐOẠN VĂN THỜI GIAN THỰC
 */
export async function getParagraphComments(storySlug: string, chapterNum: number, paraIndex: number) {
  try {
    const { rows } = await sql`
      SELECT * FROM paragraph_comments 
      WHERE story_slug = ${storySlug} 
        AND chapter_number = ${chapterNum} 
        AND paragraph_index = ${paraIndex}
      ORDER BY created_at ASC
    `
    return rows
  } catch (error) {
    console.error("Lỗi lấy bình luận đoạn văn:", error)
    return []
  }
}

/**
 * GỬI BÌNH LUẬN / THẢ CẢM XÚC VÀO ĐOẠN VĂN (TỰ ĐỘNG GỬI THÔNG BÁO CHO ĐỘC GIẢ VÀ ADMIN)
 */
export async function addParagraphComment(
  storySlug: string,
  chapterNum: number,
  paraIndex: number,
  senderName: string,
  content: string,
  reaction?: string
) {
  if (!senderName.trim() || !content.trim()) {
    return { success: false, error: "Vui lòng nhập đầy đủ!" }
  }

  try {
    // 1. LƯU BÌNH LUẬN VÀO DATABASE NHƯ BÌNH THƯỜNG
    await sql`
      INSERT INTO paragraph_comments (story_slug, chapter_number, paragraph_index, sender_name, content, reaction, created_at)
      VALUES (${storySlug}, ${chapterNum}, ${paraIndex}, ${senderName}, ${content}, ${reaction || null}, NOW())
    `

    // =========================================================
    // 🌟 LOGIC XỬ LÝ THÔNG BÁO NGẦM (BACKGROUND NOTIFICATIONS)
    // =========================================================
    
    // Nếu chỉ là thao tác thả Sticker Discord thì KHÔNG gửi thông báo để tránh spam
    if (content === '||DISCORD_REACTION||') {
      revalidatePath('/', 'layout') // Ép làm mới giao diện
      return { success: true }
    }

    // Phân tách dữ liệu người gửi hiện tại
    const senderParts = senderName.split(' ||USER_ID||:')
    const actorName = senderParts[0] || 'Một độc giả'
    const restSender = senderParts[1] || ''
    const actorId = restSender.split(' ||AVATAR_URL||:')[0] || ''
    const actorAvatar = restSender.split(' ||AVATAR_URL||:')[1] || ''

    // Phân tách nội dung để tạo Preview Text ngắn gọn gọn gàng (Bỏ token hình ảnh và parent)
    let cleanText = content.split(' ||IMAGE_URL||:')[0].split(' ||PARENT_ID||:')[0]
    if (cleanText.length > 50) cleanText = cleanText.substring(0, 50) + '...'
    if (!cleanText.trim() && content.includes('||IMAGE_URL||:')) cleanText = '[Đã gửi một hình ảnh]'

    // Kiểm tra xem đây có phải là một câu Phản hồi (Reply) không?
    let parentUserId = null
    const parentIdMatch = content.match(/\|\|PARENT_ID\|\|:(\d+)/)
    
    if (parentIdMatch && parentIdMatch[1]) {
      const parentId = parseInt(parentIdMatch[1])
      // Truy vấn tìm người đăng bình luận gốc
      const { rows: parentRows } = await sql`SELECT sender_name FROM paragraph_comments WHERE id = ${parentId}`
      if (parentRows.length > 0) {
        const pSenderParts = (parentRows[0].sender_name || '').split(' ||USER_ID||:')
        parentUserId = (pSenderParts[1] || '').split(' ||AVATAR_URL||:')[0]
      }
    }

    // A. BẮN THÔNG BÁO CHO ĐỘC GIẢ BỊ PHẢN HỒI (Tránh tự thông báo cho chính mình)
    if (parentUserId && parentUserId !== actorId) {
      await sql`
        INSERT INTO notifications (recipient_id, sender_name, sender_avatar, type, story_slug, chapter_number, preview_text, created_at)
        VALUES (${parentUserId}, ${actorName}, ${actorAvatar}, 'REPLY', ${storySlug}, ${chapterNum}, ${cleanText}, NOW())
      `
    }

    // B. BẮN THÔNG BÁO CHO ADMIN (Gửi thông báo 'NEW_COMMENT' cho hòm thư Admin)
    await sql`
      INSERT INTO notifications (recipient_id, sender_name, sender_avatar, type, story_slug, chapter_number, preview_text, created_at)
      VALUES ('ADMIN', ${actorName}, ${actorAvatar}, 'NEW_COMMENT', ${storySlug}, ${chapterNum}, ${cleanText}, NOW())
    `

    revalidatePath('/', 'layout') // Ép làm mới giao diện
    return { success: true }
  } catch (error: any) {
    console.error("Lỗi lưu bình luận đoạn văn:", error)
    return { success: false, error: error.message }
  }
}

/**
 * XÓA BÌNH LUẬN ĐOẠN VĂN
 */
export async function deleteParagraphComment(commentId: number) {
  try {
    // 1. Xóa bình luận gốc được chọn
    await sql`DELETE FROM paragraph_comments WHERE id = ${commentId}`

    // 2. 🌟 SỬA LỖI BÌNH LUẬN MA: Tìm và diệt sạch toàn bộ các phản hồi con "ăn theo" bình luận này!
    const parentMarker = `%||PARENT_ID||:${commentId}`
    await sql`DELETE FROM paragraph_comments WHERE content LIKE ${parentMarker}`

    revalidatePath('/', 'layout') // Ép Next.js xóa cache mượt mà
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * CHỈNH SỬA NỘI DUNG BÌNH LUẬN ĐOẠN VĂN
 */
export async function updateParagraphComment(commentId: number, newContent: string) {
  try {
    await sql`UPDATE paragraph_comments SET content = ${newContent} WHERE id = ${commentId}`
    revalidatePath('/', 'layout') // Ép làm mới giao diện
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * LẤY SỐ LƯỢNG BÌNH LUẬN ĐOẠN VĂN (CHỈ ĐẾM CMT CHỮ, BỎ QUA THẢ CẢM XÚC DISCORD)
 */
export async function getChapterParagraphCommentCounts(storySlug: string, chapterNum: number) {
  try {
    const { rows } = await sql`
      SELECT paragraph_index, COUNT(*)::int as comment_count 
      FROM paragraph_comments 
      WHERE story_slug = ${storySlug} 
        AND chapter_number = ${chapterNum}
        AND reaction IS NULL
      GROUP BY paragraph_index
    `
    return rows as { paragraph_index: number; comment_count: number }[]
  } catch (error) {
    return []
  }
}

/**
 * LẤY TOÀN BỘ BÌNH LUẬN TRONG CHƯƠNG (GỒM CẢ BÌNH LUẬN CHƯƠNG LẪN ĐOẠN VĂN, LỌC BỎ STICKER DISCORD)
 */
export async function getChapterAllComments(storySlug: string, chapterNum: number) {
  try {
    const { rows } = await sql`
      SELECT * FROM paragraph_comments 
      WHERE story_slug = ${storySlug} 
        AND chapter_number = ${chapterNum}
        AND reaction IS NULL
      ORDER BY created_at ASC
    `
    return rows
  } catch (error) {
    console.error("Lỗi lấy toàn bộ bình luận chương:", error)
    return []
  }
}