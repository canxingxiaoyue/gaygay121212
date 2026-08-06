'use server'

import { sql } from '@vercel/postgres'
import { auth } from '@clerk/nextjs/server'

// 1. ACTION: LẤY DANH SÁCH BÌNH LUẬN CỦA TRUYỆN
export async function getComments(storySlug: string) {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        story_slug TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        user_avatar TEXT,
        content TEXT,
        rating INT DEFAULT 5,
        parent_id INT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    const res = await sql`
      SELECT * FROM comments 
      WHERE story_slug = ${storySlug} 
      ORDER BY created_at ASC
    `
    return res.rows
  } catch (error) {
    console.error("Lỗi lấy bình luận:", error)
    return []
  }
}

// 2. ACTION: THÊM BÌNH LUẬN MỚI
export async function addComment(
  storySlug: string,
  userId: string,
  userName: string,
  userAvatar: string,
  content: string,
  rating: number = 5,
  parentId?: number
) {
  try {
    const res = await sql`
      INSERT INTO comments (story_slug, user_id, user_name, user_avatar, content, rating, parent_id)
      VALUES (${storySlug}, ${userId}, ${userName}, ${userAvatar}, ${content}, ${rating}, ${parentId || null})
      RETURNING *
    `
    return { success: true, comment: res.rows[0] }
  } catch (error: any) {
    console.error("Lỗi thêm bình luận:", error)
    return { success: false, error: error.message }
  }
}

// 3. ACTION: XÓA BÌNH LUẬN
export async function deleteComment(commentId: number) {
  const { userId } = await auth()
  const ADMIN_ID = process.env.NEXT_PUBLIC_ADMIN_ID

  try {
    const check = await sql`SELECT user_id FROM comments WHERE id = ${commentId} LIMIT 1`
    if (check.rows.length === 0) return { success: false, error: 'Không tìm thấy bình luận!' }

    const authorId = check.rows[0].user_id
    const isOwner = userId && userId === authorId
    const isAdmin = userId && userId === ADMIN_ID

    if (!isOwner && !isAdmin) {
      return { success: false, error: 'Bạn không có quyền xóa bình luận này!' }
    }

    await sql`DELETE FROM comments WHERE parent_id = ${commentId}`
    await sql`DELETE FROM comments WHERE id = ${commentId}`

    return { success: true }
  } catch (error: any) {
    console.error("Lỗi xóa bình luận:", error)
    return { success: false, error: error.message }
  }
}

// 4. ACTION: BẤM BẬT/TẮT THẢ STICKER KLEIN CHO BÌNH LUẬN
export async function toggleCommentReaction(commentId: number, stickerId: string) {
  const { userId } = await auth()
  if (!userId) {
    return { success: false, error: 'Bạn cần đăng nhập để thả dấu chân!' }
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS comment_reactions (
        id SERIAL PRIMARY KEY,
        comment_id INT NOT NULL,
        user_id TEXT NOT NULL,
        sticker_id TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(comment_id, user_id, sticker_id)
      );
    `

    const existing = await sql`
      SELECT id FROM comment_reactions 
      WHERE comment_id = ${commentId} AND user_id = ${userId} AND sticker_id = ${stickerId}
      LIMIT 1
    `

    if (existing.rows.length > 0) {
      await sql`
        DELETE FROM comment_reactions 
        WHERE comment_id = ${commentId} AND user_id = ${userId} AND sticker_id = ${stickerId}
      `
      return { success: true, action: 'removed' }
    } else {
      await sql`
        INSERT INTO comment_reactions (comment_id, user_id, sticker_id)
        VALUES (${commentId}, ${userId}, ${stickerId})
      `
      return { success: true, action: 'added' }
    }
  } catch (error: any) {
    console.error("Lỗi thả dấu chân:", error)
    return { success: false, error: error.message }
  }
}

// 5. ACTION: LẤY DANH SÁCH LƯỢT THẢ STICKER CHO BÌNH LUẬN
export async function getCommentReactions(commentIds: number[]) {
  let userId: string | null = null
  try {
    const authObj = await auth()
    userId = authObj.userId
  } catch (_) {
    userId = null
  }

  if (!commentIds || commentIds.length === 0) return {}

  try {
    const safeIds = commentIds.map(n => Number(n)).filter(n => !isNaN(n))
    if (safeIds.length === 0) return {}

    const res = await sql.query(
      `SELECT comment_id, sticker_id, COUNT(*) as count,
              MAX(CASE WHEN user_id = $1 THEN 1 ELSE 0 END) as user_reacted
       FROM comment_reactions 
       WHERE comment_id IN (${safeIds.join(',')})
       GROUP BY comment_id, sticker_id`,
      [userId || '']
    )

    const reactionsMap: Record<number, Record<string, { count: number; userReacted: boolean }>> = {}

    res.rows.forEach((row) => {
      const cId = Number(row.comment_id)
      const sId = String(row.sticker_id)
      const count = Number(row.count)
      const userReacted = Boolean(Number(row.user_reacted) === 1)

      if (!reactionsMap[cId]) reactionsMap[cId] = {}
      reactionsMap[cId][sId] = { count, userReacted }
    })

    return reactionsMap
  } catch (error) {
    console.error("Lỗi lấy danh sách lượt thả dấu chân:", error)
    return {}
  }
}

// 🌟 6. ACTION MỚI: LẤY ĐIỂM ĐÁNH GIÁ TRUNG BÌNH CỦA TRUYỆN (SỬA LỖI STORY RATING)
export async function getStoryRating(storySlug: string) {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        story_slug TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        user_avatar TEXT,
        content TEXT,
        rating INT DEFAULT 5,
        parent_id INT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    const res = await sql`
      SELECT rating FROM comments 
      WHERE story_slug = ${storySlug} AND parent_id IS NULL
    `

    if (res.rows.length === 0) {
      return { average: 5.0, count: 0 }
    }

    const totalSum = res.rows.reduce((sum, row) => sum + (Number(row.rating) || 5), 0)
    const count = res.rows.length
    const average = Number((totalSum / count).toFixed(1))

    return { average, count }
  } catch (error) {
    console.error("Lỗi getStoryRating:", error)
    return { average: 5.0, count: 0 }
  }
}