'use server'

import { sql } from '@vercel/postgres'

/**
 * LẤY DANH SÁCH ĐÁNH GIÁ/BÌNH LUẬN TRUYỆN
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
 * 🌟 HÀM LẤY ĐIỂM ĐÁNH GIÁ TRUNG BÌNH CỦA TRUYỆN (ĐÃ KHÔI PHỤC CHỐNG LỖI BIÊN DỊCH) [2]
 */
export async function getStoryRating(storySlug: string) {
  try {
    const { rows } = await sql`
      SELECT rating FROM comments 
      WHERE story_id = ${storySlug} AND parent_id IS NULL AND rating > 0
    `
    if (rows.length === 0) {
      return { average: "5.0", count: 0 }
    }
    const total = rows.reduce((acc, row) => acc + (row.rating || 0), 0)
    const average = (total / rows.length).toFixed(1)
    return { average, count: rows.length }
  } catch (error) {
    console.error("Lỗi tính điểm đánh giá truyện:", error)
    return { average: "5.0", count: 0 }
  }
}

/**
 * HÀM THÊM ĐÁNH GIÁ NÂNG CẤP: TỰ ĐỘNG BẮN THÔNG BÁO CHO ĐỘC GIẢ VÀ ADMIN
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
    // 1. LƯU ĐÁNH GIÁ MỚI VÀO DATABASE
    await sql`
      INSERT INTO comments (story_id, user_id, user_name, user_avatar, content, rating, parent_id, created_at)
      VALUES (${storySlug}, ${userId}, ${userName}, ${userAvatar}, ${content}, ${rating}, ${parentId || null}, NOW())
    `

    // =========================================================
    // 🌟 LOGIC BẮN THÔNG BÁO TỰ ĐỘNG (BACKGROUND NOTIFICATIONS)
    // =========================================================
    
    let cleanText = content.trim()
    if (cleanText.length > 50) {
      cleanText = cleanText.substring(0, 50) + '...'
    }

    if (parentId) {
      // A. ĐÂY LÀ PHẢN HỒI (REPLY)
      const { rows: parentRows } = await sql`SELECT user_id FROM comments WHERE id = ${parentId} LIMIT 1`
      if (parentRows.length > 0) {
        const parentUserId = parentRows[0].user_id
        
        if (parentUserId !== userId) {
          await sql`
            INSERT INTO notifications (recipient_id, sender_name, sender_avatar, type, story_slug, chapter_number, preview_text, target_link, created_at)
            VALUES (${parentUserId}, ${userName}, ${userAvatar}, 'REPLY', ${storySlug}, 0, ${cleanText}, ${`/truyen/${storySlug}`}, NOW())
          `
        }
      }
    } else {
      // B. ĐÂY LÀ ĐÁNH GIÁ TRUYỆN MỚI
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