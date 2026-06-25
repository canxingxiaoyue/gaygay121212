'use server'

import { sql } from '@vercel/postgres'

// 1. Tự động tăng lượt xem khi có người truy cập (Dùng thuật toán UPSERT siêu mạnh)
export async function incrementViews(storySlug: string) {
  try {
    await sql`
      INSERT INTO story_views (story_slug, view_count) 
      VALUES (${storySlug}, 1) 
      ON CONFLICT (story_slug) 
      DO UPDATE SET view_count = story_views.view_count + 1
    `
    return { success: true }
  } catch (error) {
    console.error("Lỗi tăng lượt xem:", error)
    return { success: false }
  }
}

// 2. Lấy số lượt xem thực tế đang có trong kho Vercel
export async function getStoryViews(storySlug: string) {
  try {
    const { rows } = await sql`
      SELECT view_count FROM story_views 
      WHERE story_slug = ${storySlug}
    `
    if (rows && rows.length > 0) {
      return rows[0].view_count
    }
    return 0
  } catch (error) {
    console.error("Lỗi lấy lượt xem:", error)
    return 0
  }
}