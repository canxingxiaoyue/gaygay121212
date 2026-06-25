'use server'

import { sql } from '@vercel/postgres'
import { revalidatePath } from 'next/cache'

// 1. Kiểm tra xem người dùng đã yêu thích truyện này chưa
export async function isFavorited(userId: string, storySlug: string) {
  try {
    const { rows } = await sql`
      SELECT 1 FROM favorites 
      WHERE user_id = ${userId} AND story_slug = ${storySlug}
    `
    return rows.length > 0
  } catch (error) {
    console.error("Lỗi kiểm tra yêu thích:", error)
    return false
  }
}

// 2. Thêm hoặc Xóa khỏi danh sách yêu thích (Bấm Trái tim)
export async function toggleFavorite(userId: string, storySlug: string) {
  try {
    const favorited = await isFavorited(userId, storySlug)

    if (favorited) {
      // Nếu đã yêu thích rồi -> Xóa đi (Unfavorite)
      await sql`
        DELETE FROM favorites 
        WHERE user_id = ${userId} AND story_slug = ${storySlug}
      `
    } else {
      // Nếu chưa yêu thích -> Thêm mới
      await sql`
        INSERT INTO favorites (user_id, story_slug) 
        VALUES (${userId}, ${storySlug})
      `
    }
    revalidatePath(`/truyen/${storySlug}`)
    revalidatePath('/yeu-thich') // Làm mới cả trang Danh sách yêu thích
    return { success: true, isFavorited: !favorited }
  } catch (error) {
    console.error("Lỗi toggle yêu thích:", error)
    return { success: false, error: String(error) }
  }
}

// 3. Lấy toàn bộ danh sách slug truyện yêu thích của 1 User
export async function getUserFavorites(userId: string) {
  try {
    const { rows } = await sql`
      SELECT story_slug FROM favorites 
      WHERE user_id = ${userId} 
      ORDER BY created_at DESC
    `
    return rows.map(row => row.story_slug)
  } catch (error) {
    console.error("Lỗi lấy danh sách yêu thích:", error)
    return []
  }
}