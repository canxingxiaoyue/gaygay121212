'use server'

import { sql } from '@vercel/postgres'

// 🌟 ACTION: TĂNG LƯỢT XEM VÀ ĐỒNG BỘ THẲNG VÀO TẤT CẢ BẢNG DATABASE
export async function incrementViews(storySlug: string) {
  if (!storySlug) return { success: false }

  try {
    // 1. Tự động kiểm tra và tạo cột views cho bảng stories và story_metadata
    try {
      await sql`ALTER TABLE stories ADD COLUMN IF NOT EXISTS views INT DEFAULT 0;`
      await sql`ALTER TABLE story_metadata ADD COLUMN IF NOT EXISTS views INT DEFAULT 0;`
    } catch (_) {}

    // 2. Tạo bảng story_views nếu chưa có
    await sql`
      CREATE TABLE IF NOT EXISTS story_views (
        story_slug TEXT PRIMARY KEY,
        views INT DEFAULT 0
      );
    `

    // 🌟 BƯỚC FIX LỖI: ÉP THÊM CỘT 'views' NẾU BẢNG CŨ CHƯA CÓ CỘT NÀY
    try {
      await sql`ALTER TABLE story_views ADD COLUMN IF NOT EXISTS views INT DEFAULT 0;`
    } catch (_) {}

    // 3. Tăng lượt xem trong bảng story_views
    await sql`
      INSERT INTO story_views (story_slug, views)
      VALUES (${storySlug}, 1)
      ON CONFLICT (story_slug)
      DO UPDATE SET views = COALESCE(story_views.views, 0) + 1
    `

    // 4. ĐỒNG BỘ TRỰC TIẾP VÀO BẢNG STORIES ĐỂ TRANG CHỦ ĐỌC THẲNG
    await sql`
      UPDATE stories 
      SET views = COALESCE(views, 0) + 1 
      WHERE slug = ${storySlug}
    `

    // 5. ĐỒNG BỘ TRỰC TIẾP VÀO BẢNG STORY_METADATA
    await sql`
      INSERT INTO story_metadata (slug, views)
      VALUES (${storySlug}, 1)
      ON CONFLICT (slug)
      DO UPDATE SET views = COALESCE(story_metadata.views, 0) + 1
    `

    return { success: true }
  } catch (error) {
    console.error("Lỗi tăng lượt xem:", error)
    return { success: false }
  }
}

// ACTION: LẤY LƯỢT XEM THỰC TẾ CỦA TRUYỆN
export async function getStoryViews(storySlug: string) {
  if (!storySlug) return 0

  try {
    // Ép thêm cột lúc đọc luôn để an toàn tuyệt đối 100%
    try {
      await sql`ALTER TABLE story_views ADD COLUMN IF NOT EXISTS views INT DEFAULT 0;`
    } catch (_) {}

    const res = await sql`
      SELECT views FROM story_views WHERE story_slug = ${storySlug} LIMIT 1
    `
    if (res.rows.length > 0) {
      return Number(res.rows[0].views || 0)
    }
    return 0
  } catch (error) {
    return 0
  }
}