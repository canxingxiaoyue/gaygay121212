'use server'

import { sql } from '@vercel/postgres'
import { auth } from '@clerk/nextjs/server'
import fs from 'fs/promises'
import path from 'path'
import { put } from '@vercel/blob' 
import { Story } from '@/lib/stories'
const STORIES: Story[] = []

const ADMIN_ID = process.env.NEXT_PUBLIC_ADMIN_ID

function checkIsAdmin(userId: string | null | undefined) {
  return userId && userId === ADMIN_ID
}

// ACTION: LẤY TAG VÀ TỰ ĐỘNG GỠ BỎ CONSTRAINT CŨ "hidden_tags_name_key"
export async function getManagedTags() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS managed_tags (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT NOT NULL
      );
    `
    await sql`
      CREATE TABLE IF NOT EXISTS hidden_tags (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL DEFAULT 'genre',
        name TEXT NOT NULL
      );
    `

    try {
      await sql`ALTER TABLE hidden_tags DROP CONSTRAINT IF EXISTS hidden_tags_name_key;`
    } catch (_) {}

    try {
      await sql`ALTER TABLE hidden_tags ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'genre';`
    } catch (_) {}

    const res = await sql`SELECT type, name FROM managed_tags ORDER BY id ASC`
    const hiddenRes = await sql`SELECT type, name FROM hidden_tags`

    const fandoms: string[] = []
    const shipdoms: string[] = []
    const genres: string[] = []

    res.rows.forEach(r => {
      if (r.type === 'fandom') fandoms.push(r.name)
      if (r.type === 'shipdom') shipdoms.push(r.name)
      if (r.type === 'genre') genres.push(r.name)
    })

    const hiddenFandoms: string[] = []
    const hiddenShipdoms: string[] = []
    const hiddenGenres: string[] = []

    hiddenRes.rows.forEach(r => {
      if (r.type === 'fandom') hiddenFandoms.push(r.name)
      if (r.type === 'shipdom') hiddenShipdoms.push(r.name)
      if (r.type === 'genre') hiddenGenres.push(r.name)
    })

    return { 
      fandoms, 
      shipdoms, 
      genres, 
      hiddenFandoms, 
      hiddenShipdoms, 
      hiddenGenres 
    }
  } catch (e) {
    console.error("Lỗi getManagedTags:", e)
    return { fandoms: [], shipdoms: [], genres: [], hiddenFandoms: [], hiddenShipdoms: [], hiddenGenres: [] }
  }
}

// ACTION: ADMIN XÓA TAG TRIỆT ĐỂ
export async function deleteManagedTag(type: 'fandom' | 'shipdom' | 'genre', name: string) {
  const { userId } = await auth()
  if (!checkIsAdmin(userId)) return { success: false, error: 'Quyền quản trị bị từ chối!' }

  try {
    const cleanName = name.trim()

    try {
      await sql`ALTER TABLE hidden_tags DROP CONSTRAINT IF EXISTS hidden_tags_name_key;`
    } catch (_) {}
    
    if (type === 'genre') {
      await sql`DELETE FROM managed_tags WHERE name = ${cleanName}`
      await sql`DELETE FROM hidden_tags WHERE name = ${cleanName}`
      await sql`
        INSERT INTO hidden_tags (type, name)
        VALUES ('genre', ${cleanName})
      `
    } else {
      await sql`DELETE FROM managed_tags WHERE type = ${type} AND name = ${cleanName}`
      await sql`DELETE FROM hidden_tags WHERE type = ${type} AND name = ${cleanName}`
      await sql`
        INSERT INTO hidden_tags (type, name)
        VALUES (${type}, ${cleanName})
      `
    }

    return { success: true }
  } catch (e: any) {
    console.error("Lỗi deleteManagedTag:", e)
    return { success: false, error: e.message }
  }
}

// ACTION: ADMIN THÊM TAG
export async function addManagedTag(type: 'fandom' | 'shipdom' | 'genre', name: string) {
  const { userId } = await auth()
  if (!checkIsAdmin(userId)) return { success: false, error: 'Quyền quản trị bị từ chối!' }

  const cleanName = name.trim()
  if (!cleanName) return { success: false, error: 'Tên tag không được để trống!' }

  try {
    try {
      await sql`ALTER TABLE hidden_tags DROP CONSTRAINT IF EXISTS hidden_tags_name_key;`
    } catch (_) {}

    await sql`DELETE FROM managed_tags WHERE type = ${type} AND name = ${cleanName}`
    await sql`
      INSERT INTO managed_tags (type, name)
      VALUES (${type}, ${cleanName})
    `

    if (type === 'genre') {
      await sql`DELETE FROM hidden_tags WHERE name = ${cleanName}`
    } else {
      await sql`DELETE FROM hidden_tags WHERE (type = ${type} OR type = 'genre') AND name = ${cleanName}`
    }

    return { success: true }
  } catch (e: any) {
    console.error("Lỗi addManagedTag:", e)
    return { success: false, error: e.message }
  }
}

// 🌟 ACTION: GỘP TRUYỆN VÀ QUÉT LẤY LƯỢT XEM CHÍNH XÁC NHẤT (Math.max)
export async function getMergedStories(onlyPublic: boolean = false): Promise<Story[]> {
  let userId: string | null = null
  try {
    const authObj = await auth()
    userId = authObj.userId
  } catch (_) {
    userId = null
  }

  const isAdmin = checkIsAdmin(userId)

  try {
    try {
      await sql`ALTER TABLE stories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`
      await sql`ALTER TABLE story_metadata ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`
      await sql`ALTER TABLE stories ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Đang ra';`
      await sql`ALTER TABLE story_metadata ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Đang ra';`
      await sql`ALTER TABLE stories ADD COLUMN IF NOT EXISTS views INT DEFAULT 0;`
      await sql`ALTER TABLE story_metadata ADD COLUMN IF NOT EXISTS views INT DEFAULT 0;`
    } catch (_) {}

    // 1. NẠP TOÀN BỘ LƯỢT XEM REAL-TIME TỪ BẢNG story_views
    const viewsMap = new Map<string, number>()
    try {
      const viewsRes = await sql`SELECT story_slug, views FROM story_views`
      viewsRes.rows.forEach(r => {
        viewsMap.set(r.story_slug, Number(r.views || 0))
      })
    } catch (_) {}

    const dbResult = await sql`
      SELECT *, COALESCE(updated_at, created_at) as last_updated 
      FROM stories 
      ORDER BY COALESCE(updated_at, created_at) DESC
    `
    const dbStories: Story[] = dbResult.rows.map((row) => {
      const baseViews = Number(row.views || 0)
      const realTimeViews = viewsMap.get(row.slug) || 0
      // 🌟 LẤY GIÁ TRỊ LỚN NHẤT ĐỂ TRÁNH TRÙNG HOẶC MẤT LƯỢT XEM
      const accurateViews = Math.max(baseViews, realTimeViews)

      return {
        slug: row.slug,
        title: row.title,
        author: row.author || 'Ẩn danh',
        cover: row.cover || '/placeholder.svg',
        genres: row.genres ? row.genres.split(',').map((g: string) => g.trim()).filter(Boolean) : [],
        status: row.status || 'Đang ra',
        rating: Number(row.rating || 5.0),
        views: accurateViews, // 🌟 GÁN LƯỢT XEM CHÍNH XÁC
        description: row.description || '',
        link: row.link || '',
        tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        is_public: row.is_public !== undefined ? row.is_public : true,
        password: row.password || '',
        updated_at: row.last_updated || row.updated_at || row.created_at,
        chapters: Array.from({ length: row.chapter_count || 0 }, (_, i) => ({
          number: i + 1,
          title: `Chương ${i + 1}`
        }))
      }
    })

    const metaResult = await sql`SELECT * FROM story_metadata`
    const metadataMap = new Map<string, any>()
    metaResult.rows.forEach((row) => {
      metadataMap.set(row.slug, row)
    })

    const safeStories = Array.isArray(STORIES) ? STORIES : []
    const allCombinedStories = [...safeStories, ...dbStories]

    const fullyMergedStories = allCombinedStories.map((s) => {
      let isPublic = (s as any).is_public !== undefined ? (s as any).is_public : true
      let updatedAt = (s as any).updated_at || (s as any).created_at
      let currentStatus = s.status || 'Đang ra'

      const meta = metadataMap.get(s.slug)
      const realTimeViews = viewsMap.get(s.slug) || 0
      const baseViews = Number(s.views || 0)
      const metaViews = Number(meta?.views || 0)
      
      // 🌟 LẤY GIÁ TRỊ LƯỢT XEM TỔNG LỚN NHẤT TỪ TẤT CẢ CÁC BẢNG
      const finalViews = Math.max(baseViews, realTimeViews, metaViews)

      if (meta) {
        const finalChapterCount = meta.chapter_count || s.chapters.length
        if (meta.is_public !== null && meta.is_public !== undefined) {
          isPublic = meta.is_public
        }
        if (meta.updated_at) {
          updatedAt = meta.updated_at
        }
        if (meta.status) {
          currentStatus = meta.status
        }
        return {
          ...s,
          is_public: isPublic,
          updated_at: updatedAt,
          status: currentStatus,
          views: finalViews, // 🌟 LƯỢT XEM HIỂN THỊ CHUẨN XÁC 100%
          title: meta.title || s.title,
          author: meta.author || s.author,
          cover: meta.cover || s.cover,
          description: meta.description || s.description,
          link: meta.link || s.link,
          genres: meta.genres ? meta.genres.split(',').map((g: string) => g.trim()).filter(Boolean) : s.genres,
          tags: meta.genres ? meta.genres.split(',').map((g: string) => g.trim()).filter(Boolean) : s.tags,
          password: meta.password !== undefined ? meta.password : (s as any).password || '',
          chapters: meta.chapter_count 
            ? Array.from({ length: finalChapterCount }, (_, i) => ({ number: i + 1, title: `Chương ${i + 1}` }))
            : s.chapters
        }
      }
      return {
        ...s,
        is_public: isPublic,
        updated_at: updatedAt,
        status: currentStatus,
        views: finalViews
      }
    })

    fullyMergedStories.sort((a, b) => {
      const timeA = new Date((a as any).updated_at || (a as any).created_at || 0).getTime()
      const timeB = new Date((b as any).updated_at || (b as any).created_at || 0).getTime()
      return timeB - timeA
    })
    
    if (onlyPublic && !isAdmin) {
      return fullyMergedStories.filter((s) => s.is_public !== false)
    }

    return fullyMergedStories
  } catch (e) {
    console.error("Lỗi đọc danh sách truyện từ Postgres:", e)
    return Array.isArray(STORIES) ? STORIES : []
  }
}

// ACTION: BẬT / TẮT TRẠNG THÁI CÔNG KHAI TRUYỆN
export async function togglePublishStory(storySlug: string, currentIsPublic: boolean) {
  const { userId } = await auth()
  if (!checkIsAdmin(userId)) return { success: false, error: 'Bạn không có quyền quản trị!' }

  const nextIsPublic = !currentIsPublic

  try {
    const dbStoryResult = await sql`SELECT slug FROM stories WHERE slug = ${storySlug} LIMIT 1`
    if (dbStoryResult.rows.length > 0) {
      await sql`
        UPDATE stories 
        SET is_public = ${nextIsPublic} 
        WHERE slug = ${storySlug}
      `
    }

    await sql`
      INSERT INTO story_metadata (slug, is_public)
      VALUES (${storySlug}, ${nextIsPublic})
      ON CONFLICT (slug)
      DO UPDATE SET is_public = ${nextIsPublic}
    `

    return { success: true, isPublic: nextIsPublic }
  } catch (error: any) {
    console.error("Lỗi đổi trạng thái công khai:", error)
    return { success: false, error: error.message }
  }
}

// ACTION: XÓA SẠCH TRUYỆN
export async function deleteStory(storySlug: string) {
  const { userId } = await auth()
  if (!checkIsAdmin(userId)) return { success: false, error: 'Bạn không có quyền quản trị!' }

  try {
    await sql`DELETE FROM chapter_contents WHERE story_slug = ${storySlug}`
    await sql`DELETE FROM story_metadata WHERE slug = ${storySlug}`
    try {
      await sql`DELETE FROM favorites WHERE story_slug = ${storySlug}`
    } catch (_) {
      try {
        await sql`DELETE FROM user_favorites WHERE story_slug = ${storySlug}`
      } catch (_) {}
    }
    await sql`DELETE FROM notifications WHERE story_slug = ${storySlug}`
    await sql`DELETE FROM stories WHERE slug = ${storySlug}`

    return { success: true }
  } catch (error: any) {
    console.error("Lỗi xóa truyện khỏi database:", error)
    return { success: false, error: error.message }
  }
}

// ACTION: THÊM 1 CHƯƠNG MỚI
export async function addNewChapter(storySlug: string, currentChapterCount: number) {
  const { userId } = await auth()
  if (!checkIsAdmin(userId)) return { success: false, error: 'Bạn không có quyền quản trị!' }

  const nextChapterNum = currentChapterCount + 1

  try {
    try {
      await sql`ALTER TABLE stories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`
      await sql`ALTER TABLE story_metadata ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`
    } catch (_) {}

    const dbStoryResult = await sql`SELECT slug FROM stories WHERE slug = ${storySlug} LIMIT 1`
    
    if (dbStoryResult.rows.length > 0) {
      await sql`
        UPDATE stories 
        SET chapter_count = ${nextChapterNum}, updated_at = NOW() 
        WHERE slug = ${storySlug}
      `
    } else {
      await sql`
        INSERT INTO story_metadata (slug, chapter_count, updated_at)
        VALUES (${storySlug}, ${nextChapterNum}, NOW())
        ON CONFLICT (slug)
        DO UPDATE SET chapter_count = ${nextChapterNum}, updated_at = NOW()
      `
    }

    let storyTitle = storySlug
    let storyCover = '/placeholder.svg'
    
    if (dbStoryResult.rows.length > 0) {
      const storyDetail = await sql`SELECT title, cover FROM stories WHERE slug = ${storySlug} LIMIT 1`
      if (storyDetail.rows.length > 0) {
        storyTitle = storyDetail.rows[0].title
        storyCover = storyDetail.rows[0].cover
      }
    } else {
      const safeStories = Array.isArray(STORIES) ? STORIES : []
      const staticStory = safeStories.find(s => s.slug === storySlug)
      if (staticStory) {
        storyTitle = staticStory.title
        storyCover = staticStory.cover
      }
    }

    let favResult
    try {
      favResult = await sql`SELECT user_id FROM favorites WHERE story_slug = ${storySlug}`
    } catch (err) {
      try {
        favResult = await sql`SELECT user_id FROM user_favorites WHERE story_slug = ${storySlug}`
      } catch (e) {
        console.error("Không tìm thấy bảng lưu favorites:", e)
      }
    }

    if (favResult && favResult.rows.length > 0) {
      for (const fav of favResult.rows) {
        await sql`
          INSERT INTO notifications (recipient_id, sender_name, sender_avatar, story_slug, type, target_link, is_read, created_at)
          VALUES (
            ${fav.user_id}, 
            ${storyTitle}, 
            ${storyCover}, 
            ${storySlug}, 
            'new_chapter', 
            ${`/truyen/${storySlug}/${nextChapterNum}`}, 
            false, 
            NOW()
          )
        `
      }
    }
    
    return { success: true, nextChapterNum }
  } catch (error: any) {
    console.error("Lỗi thêm chương:", error)
    return { success: false, error: error.message }
  }
}

// ACTION: TẠO TRUYỆN MỚI TRÊN WEB
export async function createNewStory(data: {
  slug: string; 
  title: string; 
  author: string; 
  cover: string; 
  genres: string; 
  description: string; 
  link: string; 
  tags: string; 
  password?: string;
  chapter_count: number;
  chapters?: { number: number; title: string; content: string }[]
}) {
  const { userId } = await auth()
  if (!checkIsAdmin(userId)) return { success: false, error: 'Bạn không có quyền quản trị!' }

  if (!data.title || !data.slug) return { success: false, error: 'Tên truyện và Slug đường dẫn là bắt buộc!' }

  try {
    try {
      await sql`ALTER TABLE stories ADD COLUMN IF NOT EXISTS password TEXT;`
      await sql`ALTER TABLE story_metadata ADD COLUMN IF NOT EXISTS password TEXT;`
      await sql`ALTER TABLE stories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`
      await sql`ALTER TABLE story_metadata ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`
      await sql`ALTER TABLE stories ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Đang ra';`
      await sql`ALTER TABLE story_metadata ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Đang ra';`
      await sql`ALTER TABLE stories ADD COLUMN IF NOT EXISTS views INT DEFAULT 0;`
      await sql`ALTER TABLE story_metadata ADD COLUMN IF NOT EXISTS views INT DEFAULT 0;`
    } catch (_) {}

    const cleanSlug = data.slug.trim().toLowerCase();
    const safeGenres = data.genres.trim().length > 250 ? data.genres.trim().slice(0, 250) : data.genres.trim();
    const safeTags = data.tags.trim().length > 250 ? data.tags.trim().slice(0, 250) : data.tags.trim();
    const cleanPassword = (data.password || '').trim();

    await sql`
      INSERT INTO stories (slug, title, author, cover, genres, status, rating, views, description, link, tags, chapter_count, is_public, password, updated_at)
      VALUES (
        ${cleanSlug}, 
        ${data.title.trim()}, 
        ${data.author.trim()}, 
        ${data.cover.trim()}, 
        ${safeGenres}, 
        'Đang ra', 5.0, 0, 
        ${data.description.trim()}, 
        ${data.link.trim()}, 
        ${safeTags}, 
        ${data.chapter_count},
        true,
        ${cleanPassword},
        NOW()
      )
      ON CONFLICT (slug) DO NOTHING
    `

    await sql`
      INSERT INTO story_metadata (slug, password, updated_at)
      VALUES (${cleanSlug}, ${cleanPassword}, NOW())
      ON CONFLICT (slug) DO UPDATE SET password = ${cleanPassword}, updated_at = NOW()
    `

    if (data.chapters && data.chapters.length > 0) {
      const chunkSize = 50;
      for (let i = 0; i < data.chapters.length; i += chunkSize) {
        const chunk = data.chapters.slice(i, i + chunkSize);
        
        await Promise.all(chunk.map(ch => {
          const safeChapterTitle = ch.title.trim().length > 250 
            ? ch.title.trim().slice(0, 247) + '...' 
            : ch.title.trim();

          return sql`
            INSERT INTO chapter_contents (story_slug, chapter_number, content, title)
            VALUES (${cleanSlug}, ${ch.number}, ${ch.content}, ${safeChapterTitle})
            ON CONFLICT (story_slug, chapter_number) 
            DO UPDATE SET content = ${ch.content}, title = ${safeChapterTitle}
          `;
        }));
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Lỗi tạo truyện:", error)
    return { success: false, error: error.message }
  }
}

// ACTION: UPLOAD ẢNH
export async function uploadImage(formData: FormData) {
  const { userId } = await auth()
  if (!checkIsAdmin(userId)) return { success: false, error: 'Bạn không có quyền quản trị!' }

  try {
    const file = formData.get('file') as File
    if (!file) return { success: false, error: 'Không tìm thấy file ảnh!' }

    if (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID) {
      try {
        const blob = await put(`story-images/${Date.now()}-${file.name.replace(/\s+/g, '-')}`, file, {
          access: 'public',
        })
        return { success: true, url: blob.url }
      } catch (e) {
        console.warn("Vercel Blob failed, switching to Base64 Data URL fallback")
      }
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const mimeType = file.type || 'image/jpeg'
    const base64String = `data:${mimeType};base64,${buffer.toString('base64')}`

    return { success: true, url: base64String }
  } catch (error: any) {
    console.error("Lỗi upload ảnh:", error)
    return { success: false, error: error.message }
  }
}

// ACTION: UPLOAD ẢNH BÌNH LUẬN
export async function uploadCommentImage(formData: FormData) {
  const { userId } = await auth()
  if (!userId) return { success: false, error: 'Bạn cần đăng nhập để tải ảnh!' }

  try {
    const file = formData.get('file') as File
    if (!file) return { success: false, error: 'Không tìm thấy file ảnh!' }

    if (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID) {
      const blob = await put(`comment-images/${Date.now()}-${file.name.replace(/\s+/g, '-')}`, file, {
        access: 'public',
      })
      return { success: true, url: blob.url }
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const mimeType = file.type || 'image/jpeg'
    const base64String = `data:${mimeType};base64,${buffer.toString('base64')}`

    return { success: true, url: base64String }
  } catch (error: any) {
    console.error("Lỗi upload ảnh bình luận:", error)
    return { success: false, error: error.message }
  }
}

// ACTION LƯU HOẶC SỬA NỘI DUNG CHƯƠNG
export async function updateChapterContent(storySlug: string, chapterNum: number, content: string, title: string) {
  const { userId } = await auth()
  if (!checkIsAdmin(userId)) return { success: false, error: 'Bạn không có quyền quản trị!' }

  try {
    await sql`
      INSERT INTO chapter_contents (story_slug, chapter_number, content, title)
      VALUES (${storySlug}, ${chapterNum}, ${content}, ${title})
      ON CONFLICT (story_slug, chapter_number)
      DO UPDATE SET content = ${content}, title = ${title}
    `

    try {
      await sql`UPDATE stories SET updated_at = NOW() WHERE slug = ${storySlug}`
      await sql`
        INSERT INTO story_metadata (slug, updated_at) VALUES (${storySlug}, NOW())
        ON CONFLICT (slug) DO UPDATE SET updated_at = NOW()
      `
    } catch (_) {}

    return { success: true }
  } catch (error: any) {
    console.error("Lỗi Postgres:", error)
    return { success: false, error: error.message }
  }
}

// ACTION LƯU HOẶC SỬA GIỚI THIỆU TRUYỆN
export async function updateStoryMetadata(slug: string, description: string, link: string, genres: string) {
  const { userId } = await auth()
  if (!checkIsAdmin(userId)) return { success: false, error: 'Bạn không có quyền quản trị!' }

  try {
    await sql`
      INSERT INTO story_metadata (slug, description, link, genres)
      VALUES (${slug}, ${description}, ${link}, ${genres})
      ON CONFLICT (slug)
      DO UPDATE SET description = ${description}, link = ${link}, genres = ${genres}
    `
    return { success: true }
  } catch (error: any) {
    console.error("Lỗi Postgres:", error)
    return { success: false, error: error.message }
  }
}

// ACTION: CHỈNH SỬA TOÀN DIỆN THÔNG TIN TRUYỆN
export async function updateFullStoryInfo(
  slug: string,
  data: { title: string; author: string; cover: string; description: string; link: string; genres: string; password?: string; status?: string }
) {
  const { userId } = await auth()
  if (!checkIsAdmin(userId)) return { success: false, error: 'Bạn không có quyền quản trị!' }

  try {
    try {
      await sql`ALTER TABLE stories ADD COLUMN IF NOT EXISTS password TEXT;`
      await sql`ALTER TABLE story_metadata ADD COLUMN IF NOT EXISTS password TEXT;`
      await sql`ALTER TABLE stories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`
      await sql`ALTER TABLE story_metadata ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`
      await sql`ALTER TABLE stories ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Đang ra';`
      await sql`ALTER TABLE story_metadata ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Đang ra';`
      await sql`ALTER TABLE stories ADD COLUMN IF NOT EXISTS views INT DEFAULT 0;`
      await sql`ALTER TABLE story_metadata ADD COLUMN IF NOT EXISTS views INT DEFAULT 0;`
    } catch (_) {}

    const cleanPassword = (data.password || '').trim();
    const cleanStatus = (data.status || 'Đang ra').trim();

    const dbStory = await sql`SELECT slug FROM stories WHERE slug = ${slug}`
    if (dbStory.rows.length > 0) {
      await sql`
        UPDATE stories 
        SET title = ${data.title}, author = ${data.author}, cover = ${data.cover}, 
            description = ${data.description}, link = ${data.link}, genres = ${data.genres},
            password = ${cleanPassword}, status = ${cleanStatus}, updated_at = NOW()
        WHERE slug = ${slug}
      `
    }

    await sql`
      INSERT INTO story_metadata (slug, title, author, cover, description, link, genres, password, status, updated_at)
      VALUES (${slug}, ${data.title}, ${data.author}, ${data.cover}, ${data.description}, ${data.link}, ${data.genres}, ${cleanPassword}, ${cleanStatus}, NOW())
      ON CONFLICT (slug)
      DO UPDATE SET 
        title = ${data.title}, author = ${data.author}, cover = ${data.cover}, 
        description = ${data.description}, link = ${data.link}, genres = ${data.genres},
        password = ${cleanPassword}, status = ${cleanStatus}, updated_at = NOW()
    `
    return { success: true }
  } catch (err: any) {
    console.error("Lỗi cập nhật truyện:", err)
    return { success: false, error: err.message }
  }
}

// ACTION: LẤY DANH SÁCH QUYỂN CỦA TRUYỆN
export async function getStoryVolumes(storySlug: string) {
  try {
    const res = await sql`
      SELECT start_chapter, title FROM story_volumes 
      WHERE story_slug = ${storySlug} 
      ORDER BY start_chapter ASC
    `
    return res.rows as { start_chapter: number; title: string }[]
  } catch (error) {
    console.error("Lỗi lấy danh sách quyển:", error)
    return []
  }
}

// ACTION: THÊM / SỬA THANH CHIA QUYỂN
export async function addOrUpdateVolume(storySlug: string, startChapter: number, title: string) {
  const { userId } = await auth()
  if (!checkIsAdmin(userId)) return { success: false, error: 'Bạn không có quyền quản trị!' }

  try {
    await sql`
      INSERT INTO story_volumes (story_slug, start_chapter, title)
      VALUES (${storySlug}, ${startChapter}, ${title})
      ON CONFLICT (story_slug, start_chapter)
      DO UPDATE SET title = ${title}
    `
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ACTION: XÓA THANH CHIA QUYỂN
export async function deleteVolume(storySlug: string, startChapter: number) {
  const { userId } = await auth()
  if (!checkIsAdmin(userId)) return { success: false, error: 'Bạn không có quyền quản trị!' }

  try {
    await sql`
      DELETE FROM story_volumes 
      WHERE story_slug = ${storySlug} AND start_chapter = ${startChapter}
    `
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ACTION: XÓA CHƯƠNG
export async function deleteChapter(storySlug: string, chapterNum: number) {
  const { userId } = await auth()
  if (!checkIsAdmin(userId)) {
    return { success: false, error: 'Bạn không có quyền quản trị!' }
  }

  try {
    await sql`
      DELETE FROM chapter_contents 
      WHERE story_slug = ${storySlug} AND chapter_number = ${chapterNum}
    `

    await sql`
      UPDATE chapter_contents 
      SET chapter_number = ((chapter_number - 1) * -1)
      WHERE story_slug = ${storySlug} AND chapter_number > ${chapterNum}
    `
    await sql`
      UPDATE chapter_contents 
      SET chapter_number = (chapter_number * -1)
      WHERE story_slug = ${storySlug} AND chapter_number < 0
    `

    const dbStoryResult = await sql`SELECT chapter_count FROM stories WHERE slug = ${storySlug} LIMIT 1`
    
    if (dbStoryResult.rows.length > 0) {
      const currentCount = dbStoryResult.rows[0].chapter_count || 0
      const nextCount = Math.max(0, currentCount - 1)
      await sql`
        UPDATE stories 
        SET chapter_count = ${nextCount} 
        WHERE slug = ${storySlug}
      `
    } else {
      const metaResult = await sql`SELECT chapter_count FROM story_metadata WHERE slug = ${storySlug} LIMIT 1`
      if (metaResult.rows.length > 0) {
        const currentCount = metaResult.rows[0].chapter_count || 0
        const nextCount = Math.max(0, currentCount - 1)
        await sql`
          UPDATE story_metadata 
          SET chapter_count = ${nextCount} 
          WHERE slug = ${storySlug}
        `
      }
    }

    await sql`
      DELETE FROM story_volumes 
      WHERE story_slug = ${storySlug} AND start_chapter = ${chapterNum} AND start_chapter > 1
    `

    await sql`
      UPDATE story_volumes 
      SET start_chapter = ((start_chapter - 1) * -1)
      WHERE story_slug = ${storySlug} AND start_chapter > ${chapterNum}
    `
    await sql`
      UPDATE story_volumes 
      SET start_chapter = (start_chapter * -1)
      WHERE story_slug = ${storySlug} AND start_chapter < 0
    `

    return { success: true }
  } catch (error: any) {
    console.error("Lỗi xóa chương:", error)
    return { success: false, error: error.message }
  }
}

// ACTION: UPLOAD DANH SÁCH CHƯƠNG HÀNG LOẠT
export async function uploadChaptersFromText(storySlug: string, chapters: { number: number; title: string; content: string }[]) {
  const { userId } = await auth()
  if (!checkIsAdmin(userId)) return { success: false, error: 'Bạn không có quyền quản trị!' }

  try {
    const chunkSize = 50;
    for (let i = 0; i < chapters.length; i += chunkSize) {
      const chunk = chapters.slice(i, i + chunkSize);
      
      await Promise.all(chunk.map(ch => {
        const safeChapterTitle = ch.title.trim().length > 250 
          ? ch.title.trim().slice(0, 247) + '...' 
          : ch.title.trim();

        return sql`
          INSERT INTO chapter_contents (story_slug, chapter_number, content, title)
          VALUES (${storySlug}, ${ch.number}, ${ch.content}, ${safeChapterTitle})
          ON CONFLICT (story_slug, chapter_number)
          DO UPDATE SET content = ${ch.content}, title = ${safeChapterTitle}
        `;
      }));
    }

    const nextChapterCount = chapters.length
    await sql`
      UPDATE stories 
      SET chapter_count = ${nextChapterCount}, updated_at = NOW() 
      WHERE slug = ${storySlug}
    `
    await sql`
      INSERT INTO story_metadata (slug, updated_at) VALUES (${storySlug}, NOW())
      ON CONFLICT (slug) DO UPDATE SET updated_at = NOW()
    `

    return { success: true }
  } catch (error: any) {
    console.error("Lỗi khi upload danh sách chương:", error)
    return { success: false, error: error.message }
  }
}

// ACTION: NHẬP ĐỒNG LOẠT DANH SÁCH CHƯƠNG
export async function bulkImportChapters(
  storySlug: string,
  startCount: number,
  chapters: { title: string; content: string }[]
) {
  try {
    const { userId } = await auth()
    if (!userId || !checkIsAdmin(userId)) {
      return { success: false, error: 'Quyền truy cập bị từ chối!' }
    }

    for (let i = 0; i < chapters.length; i++) {
      const chap = chapters[i]
      const nextChapterNum = startCount + i + 1

      const safeChapterTitle = chap.title.trim().length > 250 
        ? chap.title.trim().slice(0, 247) + '...' 
        : chap.title.trim()

      await sql`
        INSERT INTO chapter_contents (story_slug, chapter_number, content, title)
        VALUES (${storySlug}, ${nextChapterNum}, ${chap.content}, ${safeChapterTitle})
        ON CONFLICT (story_slug, chapter_number) 
        DO UPDATE SET content = ${chap.content}, title = ${safeChapterTitle}
      `
    }

    const nextTotalCount = startCount + chapters.length
    const dbStoryResult = await sql`SELECT slug FROM stories WHERE slug = ${storySlug} LIMIT 1`
    
    if (dbStoryResult.rows.length > 0) {
      await sql`
        UPDATE stories 
        SET chapter_count = ${nextTotalCount}, updated_at = NOW() 
        WHERE slug = ${storySlug}
      `
    } else {
      await sql`
        INSERT INTO story_metadata (slug, chapter_count, updated_at)
        VALUES (${storySlug}, ${nextTotalCount}, NOW())
        ON CONFLICT (slug)
        DO UPDATE SET chapter_count = ${nextTotalCount}, updated_at = NOW()
      `
    }

    return { success: true }
  } catch (error: any) {
    console.error("Lỗi import chương đồng loạt:", error)
    return { success: false, error: error.message }
  }
}

// ACTION: XÓA CÙNG LÚC NHIỀU CHƯƠNG ĐÃ CHỌN
export async function bulkDeleteChapters(storySlug: string, chapterNums: number[]) {
  const { userId } = await auth()
  if (!checkIsAdmin(userId)) {
    return { success: false, error: 'Bạn không có quyền quản trị!' }
  }

  if (!chapterNums || chapterNums.length === 0) {
    return { success: true }
  }

  try {
    const safeChapterNums = chapterNums.map(n => Number(n)).filter(n => !isNaN(n))
    if (safeChapterNums.length === 0) return { success: true }

    await sql.query(
      `DELETE FROM chapter_contents 
       WHERE story_slug = $1 AND chapter_number IN (${safeChapterNums.join(',')})`,
      [storySlug]
    )

    const remaining = await sql`
      SELECT chapter_number, title, content
      FROM chapter_contents
      WHERE story_slug = ${storySlug}
      ORDER BY chapter_number ASC
    `

    await sql`
      UPDATE chapter_contents
      SET chapter_number = (chapter_number * -1)
      WHERE story_slug = ${storySlug} AND chapter_number > 0
    `

    for (let i = 0; i < remaining.rows.length; i++) {
      const row = remaining.rows[i]
      const oldNum = row.chapter_number
      const newNum = i + 1
      const targetOldNum = 0 - Math.abs(oldNum)

      await sql`
        UPDATE chapter_contents
        SET chapter_number = ${newNum}
        WHERE story_slug = ${storySlug} AND chapter_number = ${targetOldNum}
      `
    }

    const newTotalCount = remaining.rows.length
    const dbStoryResult = await sql`SELECT slug FROM stories WHERE slug = ${storySlug} LIMIT 1`

    if (dbStoryResult.rows.length > 0) {
      await sql`
        UPDATE stories
        SET chapter_count = ${newTotalCount}
        WHERE slug = ${storySlug}
      `
    } else {
      await sql`
        INSERT INTO story_metadata (slug, chapter_count)
        VALUES (${storySlug}, ${newTotalCount})
        ON CONFLICT (slug)
        DO UPDATE SET chapter_count = ${newTotalCount}
      `
    }

    return { success: true }
  } catch (error: any) {
    console.error("Lỗi xóa hàng loạt chương:", error)
    return { success: false, error: error.message }
  }
}