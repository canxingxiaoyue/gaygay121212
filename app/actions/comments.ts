'use server'

import { sql } from '@vercel/postgres'

/**
 * LẤY DANH SÁCH ĐÁNH GIÁ/BÌNH LUẬN TRUYỆN (Sử dụng đúng cột story_id gốc của bạn)
 */
export async function getComments(storySlug: string) {
  try {
    const { rows } = await sql`
      SELECT * FROM comments 
      WHERE story_id = ${storySlug} 
      ORDER BY created_at ASC
    `
    return rows
  } catch (error) {
    console.error("Lỗi lấy danh sách đánh giá:", error)
    return []
  }
}

/**
 * 🌟 HÀM THÊM ĐÁNH GIÁ NÂNG CẤP: TỰ ĐỘNG BẮN THÔNG BÁO CHO ĐỘC GIẢ VÀ ADMIN (ĐÃ SỬA CỘT STORY_ID CHUẨN) [2]
 */
export async function addComment(
  storySlug: string,
  userId: string,
  userName: string,
  userAvatar: string,
  content: string,
  rating: number,
  parentId?: number | null
) {
  if (!content.trim()) {
    return { success: false, error: "Nội dung không được để trống!" }
  }

  try {
    // 1. LƯU ĐÁNH GIÁ MỚI VÀO DATABASE (Sử dụng đúng cột story_id chuẩn của bạn) [1.1.2]
    await sql`
      INSERT INTO comments (story_id, user_id, user_name, user_avatar, content, rating, parent_id, created_at)
      VALUES (${storySlug}, ${userId}, ${userName}, ${userAvatar}, ${content}, ${rating}, ${parentId || null}, NOW())
    `

    // =========================================================
    // 🌟 LOGIC BẮN THÔNG BÁO TỰ ĐỘNG (BACKGROUND NOTIFICATIONS)
    // =========================================================
    
    // Cắt ngắn nội dung đánh giá để làm văn bản xem trước (Preview Text) gọn gàng
    let cleanText = content.trim()
    if (cleanText.length > 50) {
      cleanText = cleanText.substring(0, 50) + '...'
    }

    if (parentId) {
      // A. ĐÂY LÀ PHẢN HỒI (REPLY): Tìm người gửi bình luận cha để bắn thông báo cho họ [2]
      const { rows: parentRows } = await sql`SELECT user_id FROM comments WHERE id = ${parentId} LIMIT 1`
      if (parentRows.length > 0) {
        const parentUserId = parentRows[0].user_id
        
        // Chỉ bắn thông báo nếu người phản hồi không phải là chủ nhân tự chat với chính mình [2]
        if (parentUserId !== userId) {
          await sql`
            INSERT INTO notifications (recipient_id, sender_name, sender_avatar, type, story_slug, chapter_number, preview_text, target_link, created_at)
            VALUES (${parentUserId}, ${userName}, ${userAvatar}, 'REPLY', ${storySlug}, 0, ${cleanText}, ${`/truyen/${storySlug}`}, NOW())
          `
        }
      }
    } else {
      // B. ĐÂY LÀ ĐÁNH GIÁ TRUYỆN MỚI (NEW REVIEW): Gửi thông báo cho hòm thư của Admin [2]
      await sql`
        INSERT INTO notifications (recipient_id, sender_name, sender_avatar, type, story_slug, chapter_number, preview_text, target_link, created_at)
        VALUES ('ADMIN', ${userName}, ${userAvatar}, 'NEW_COMMENT', ${storySlug}, 0, ${cleanText}, ${`/truyen/${storySlug}`}, NOW())
      `
    }

    return { success: true }
  } catch (error: any) {
    console.error("Lỗi khi thêm đánh giá:", error)
    return { success: false, error: error.message }
  }
}

/**
 * XÓA ĐÁNH GIÁ/BÌNH LUẬN
 */
export async function deleteComment(commentId: number) {
  try {
    await sql`DELETE FROM comments WHERE id = ${commentId}`
    return { success: true }
  } catch (error: any) {
    console.error("Lỗi xóa đánh giá:", error)
    return { success: false, error: error.message }
  }
}