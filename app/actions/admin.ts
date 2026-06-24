'use server' // Khai báo Server Action

import { sql } from '@vercel/postgres'
import { auth } from '@clerk/nextjs/server'
import fs from 'fs/promises'
import path from 'path'
import { put } from '@vercel/blob' // 🌟 ĐÃ THÊM: Import thư viện đám mây của Vercel
import { STORIES, Story } from '@/lib/stories'

const ADMIN_ID = process.env.NEXT_PUBLIC_ADMIN_ID

function checkIsAdmin(userId: string | null | undefined) {
  return userId && userId === ADMIN_ID
}

/**
 * ACTION: GỘP TRUYỆN VÀ ĐỒNG BỘ CẢ METADATA SỬA ĐÈ TỪ DATABASE
 * @param onlyPublic Nếu là true, chỉ trả về các truyện đang được công khai cho độc giả đọc
 */
export async function getMergedStories(onlyPublic: boolean = false): Promise<Story[]> {
  try {
    // 1. Lấy tất cả truyện mới được đăng từ bảng stories trên web
    const dbResult = await sql`SELECT * FROM stories ORDER BY created_at DESC`
    const dbStories: Story[] = dbResult.rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      author: row.author || 'Ẩn danh',
      cover: row.cover || '/placeholder.svg',
      genres: row.genres ? row.genres.split(',').map((g: string) => g.trim()).filter(Boolean) : [],
      status: row.status || 'Đang ra',
      rating: Number(row.rating || 5.0),
      views: Number(row.views || 0),
      description: row.description || '',
      link: row.link || '',
      tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      is_public: row.is_public !== undefined ? row.is_public : true, // Nhận trạng thái công khai từ database
      chapters: Array.from({ length: row.chapter_count || 0 }, (_, i) => ({
        number: i + 1,
        title: `Chương ${i + 1}`
      }))
    }))

    // 2. Lấy toàn bộ thông tin chỉnh sửa từ bảng story_metadata
    const metaResult = await sql`SELECT * FROM story_metadata`
    const metadataMap = new Map<string, any>()
    metaResult.rows.forEach((row) => {
      metadataMap.set(row.slug, row)
    })

    // 3. Tiến hành gộp chung mảng tĩnh và mảng database lại làm một
    const allCombinedStories = [...STORIES, ...dbStories]

    // 4. Đồng bộ thông tin đã sửa đè từ story_metadata vào TOÀN BỘ danh sách truyện đã gộp
    const fullyMergedStories = allCombinedStories.map((s) => {
      // Trạng thái công khai mặc định là true
      let isPublic = (s as any).is_public !== undefined ? (s as any).is_public : true
      
      const meta = metadataMap.get(s.slug)
      if (meta) {
        const finalChapterCount = meta.chapter_count || s.chapters.length
        if (meta.is_public !== null && meta.is_public !== undefined) {
          isPublic = meta.is_public
        }
        return {
          ...s,
          is_public: isPublic,
          // NHẬN DIỆN THÔNG TIN ĐÃ SỬA
          title: meta.title || s.title,
          author: meta.author || s.author,
          cover: meta.cover || s.cover,
          description: meta.description || s.description,
          link: meta.link || s.link,
          genres: meta.genres ? meta.genres.split(',').map((g: string) => g.trim()).filter(Boolean) : s.genres,
          tags: meta.genres ? meta.genres.split(',').map((g: string) => g.trim()).filter(Boolean) : s.tags,
          chapters: meta.chapter_count 
            ? Array.from({ length: finalChapterCount }, (_, i) => ({ number: i + 1, title: `Chương ${i + 1}` }))
            : s.chapters
        }
      }
      return {
        ...s,
        is_public: isPublic
      }
    })
    
    // Nếu chế độ chỉ công khai được bật, lọc bỏ toàn bộ các truyện bị ẩn (is_public === false)
    if (onlyPublic) {
      return fullyMergedStories.filter((s) => s.is_public !== false)
    }

    return fullyMergedStories
  } catch (e) {
    console.error("Lỗi đọc danh sách truyện từ Postgres:", e)
    return STORIES
  }
}

/**
 * ACTION: BẬT / TẮT TRẠNG THÁI CÔNG KHAI TRUYỆN (HỦY ĐĂNG)
 */
export async function togglePublishStory(storySlug: string, currentIsPublic: boolean) {
  const { userId } = await auth()
  if (!checkIsAdmin(userId)) return { success: false, error: 'Bạn không có quyền quản trị!' }

  const nextIsPublic = !currentIsPublic

  try {
    // 1. Nếu là truyện trên database, cập nhật trực tiếp tại bảng stories
    const dbStoryResult = await sql`SELECT slug FROM stories WHERE slug = ${storySlug} LIMIT 1`
    if (dbStoryResult.rows.length > 0) {
      await sql`
        UPDATE stories 
        SET is_public = ${nextIsPublic} 
        WHERE slug = ${storySlug}
      `
    }

    // 2. Đồng bộ trạng thái ẩn/hiện vào bảng metadata (áp dụng được cho cả truyện tĩnh)
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

/**
 * ACTION: XÓA SẠCH TRUYỆN VÀ DỌN DẸP DỮ LIỆU LIÊN QUAN
 */
export async function deleteStory(storySlug: string) {
  const { userId } = await auth()
  if (!checkIsAdmin(userId)) return { success: false, error: 'Bạn không có quyền quản trị!' }

  try {
    // 1. Xóa nội dung các chương truyện trong chapter_contents
    await sql`DELETE FROM chapter_contents WHERE story_slug = ${storySlug}`

    // 2. Xóa dữ liệu chỉnh sửa trong story_metadata
    await sql`DELETE FROM story_metadata WHERE slug = ${storySlug}`

    // 3. Xóa các lượt lưu yêu thích của người dùng đối với truyện này
    try {
      await sql`DELETE FROM favorites WHERE story_slug = ${storySlug}`
    } catch (_) {
      try {
        await sql`DELETE FROM user_favorites WHERE story_slug = ${storySlug}`
      } catch (_) {}
    }

    // 4. Xóa tất cả thông báo hệ thống liên quan tới truyện này
    await sql`DELETE FROM notifications WHERE story_slug = ${storySlug}`

    // 5. Xóa truyện khỏi danh sách chính trên cơ sở dữ liệu
    await sql`DELETE FROM stories WHERE slug = ${storySlug}`

    return { success: true }
  } catch (error: any) {
    console.error("Lỗi xóa truyện khỏi database:", error)
    return { success: false, error: error.message }
  }
}

/**
 * ACTION: TỰ ĐỘNG TĂNG SỐ LƯỢNG CHƯƠNG KHI KHỞI TẠO CHƯƠNG MỚI & GỬI THÔNG BÁO CHO ĐỘC GIẢ
 */
export async function addNewChapter(storySlug: string, currentChapterCount: number) {
  const { userId } = await auth()
  if (!checkIsAdmin(userId)) return { success: false, error: 'Bạn không có quyền quản trị!' }

  const nextChapterNum = currentChapterCount + 1

  try {
    // Kiểm tra xem truyện này nằm ở bảng stories (truyện mới) hay chỉ có trong stories.ts (truyện tĩnh)
    const dbStoryResult = await sql`SELECT slug FROM stories WHERE slug = ${storySlug} LIMIT 1`
    
    if (dbStoryResult.rows.length > 0) {
      // Nếu là truyện mới trên database, tăng trực tiếp chapter_count ở bảng stories
      await sql`
        UPDATE stories 
        SET chapter_count = ${nextChapterNum} 
        WHERE slug = ${storySlug}
      `
    } else {
      // Nếu là truyện tĩnh, tăng chapter_count và lưu đè vào bảng story_metadata
      await sql`
        INSERT INTO story_metadata (slug, chapter_count)
        VALUES (${storySlug}, ${nextChapterNum})
        ON CONFLICT (slug)
        DO UPDATE SET chapter_count = ${nextChapterNum}
      `
    }

    // 1. Lấy Tên truyện và Ảnh bìa làm avatar thông báo
    let storyTitle = storySlug
    let storyCover = '/placeholder.svg'
    
    if (dbStoryResult.rows.length > 0) {
      const storyDetail = await sql`SELECT title, cover FROM stories WHERE slug = ${storySlug} LIMIT 1`
      if (storyDetail.rows.length > 0) {
        storyTitle = storyDetail.rows[0].title
        storyCover = storyDetail.rows[0].cover
      }
    } else {
      const staticStory = STORIES.find(s => s.slug === storySlug)
      if (staticStory) {
        storyTitle = staticStory.title
        storyCover = staticStory.cover
      }
    }

    // 2. Tìm danh sách những người dùng đã lưu yêu thích truyện này
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

    // 3. Thêm bản ghi thông báo loại 'new_chapter'
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

/**
 * 🌟 ĐÃ CẬP NHẬT: TẠO TRUYỆN MỚI TRÊN WEB, TỰ ĐỘNG LƯU CHƯƠNG TỪ FILE & GỬI THÔNG BÁO CHO TẤT CẢ USER
 */
export async function createNewStory(data: {
  slug: string; 
  title: string; 
  author: string; 
  cover: string; 
  genres: string; 
  description: string; 
  link: string; 
  tags: string; 
  chapter_count: number;
  chapters?: { number: number; title: string; content: string }[] // Nhận thêm mảng chương bóc tách từ file
}) {
  const { userId } = await auth()
  if (!checkIsAdmin(userId)) return { success: false, error: 'Bạn không có quyền quản trị!' }

  if (!data.title || !data.slug) return { success: false, error: 'Tên truyện và Slug đường dẫn là bắt buộc!' }

  try {
    const cleanSlug = data.slug.trim().toLowerCase();

    // 🌟 PHÒNG VỆ: Cắt bớt danh sách thể loại và tags nếu nó vượt quá 250 ký tự để tránh crash DB VARCHAR(255)
    const safeGenres = data.genres.trim().length > 250 ? data.genres.trim().slice(0, 250) : data.genres.trim();
    const safeTags = data.tags.trim().length > 250 ? data.tags.trim().slice(0, 250) : data.tags.trim();

    // 1. Lưu metadata của truyện mới vào bảng stories
    await sql`
      INSERT INTO stories (slug, title, author, cover, genres, status, rating, views, description, link, tags, chapter_count, is_public)
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
        true -- Mặc định khi tạo truyện mới sẽ ở chế độ công khai
      )
      ON CONFLICT (slug) DO NOTHING
    `

    // 2. 🌟 LƯU NỘI DUNG CÁC CHƯƠNG (NẾU ĐĂNG BẰNG FILE)
    if (data.chapters && data.chapters.length > 0) {
      for (const ch of data.chapters) {
        // 🌟 PHÒNG VỆ: Tự động cắt ngắn tiêu đề chương phụ nếu bóc tách quá dài để tránh lỗi DB
        const safeChapterTitle = ch.title.trim().length > 250 
          ? ch.title.trim().slice(0, 247) + '...' 
          : ch.title.trim();

        await sql`
          INSERT INTO chapter_contents (story_slug, chapter_number, content, title)
          VALUES (
            ${cleanSlug}, 
            ${ch.number}, 
            ${ch.content}, 
            ${safeChapterTitle}
          )
          ON CONFLICT (story_slug, chapter_number) 
          DO UPDATE SET content = ${ch.content}, title = ${safeChapterTitle}
        `
      }
    }

    // 3. Tự động lấy danh sách User nhận thông báo
    let userIds: string[] = []
    try {
      const usersRes = await sql`SELECT id FROM users`
      userIds = usersRes.rows.map(r => r.id)
    } catch (err) {
      const activeUsersRes = await sql`SELECT DISTINCT recipient_id FROM notifications`
      userIds = activeUsersRes.rows.map(r => r.recipient_id)
    }

    // 4. Gửi thông báo truyện mới cho độc giả
    if (userIds.length > 0) {
      for (const uid of userIds) {
        await sql`
          INSERT INTO notifications (recipient_id, sender_name, sender_avatar, story_slug, type, target_link, is_read, created_at)
          VALUES (
            ${uid}, 
            ${data.title.trim()}, 
            ${data.cover.trim()}, 
            ${cleanSlug}, 
            'new_story', 
            ${`/truyen/${cleanSlug}`}, 
            false, 
            NOW()
          )
        `
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Lỗi tạo truyện:", error)
    return { success: false, error: error.message }
  }
}

/**
 * 🌟 ĐÃ CẬP NHẬT: TỰ ĐỘNG LƯU FILE ẢNH LÊN CLOUD VERCEL BLOB NẾU CÓ TOKEN, FALLBACK LƯU LOCAL NẾU CHẠY OFFLINE
 */
export async function uploadImage(formData: FormData) {
  const { userId } = await auth()
  if (!checkIsAdmin(userId)) return { success: false, error: 'Bạn không có quyền quản trị!' }

  try {
    const file = formData.get('file') as File
    if (!file) return { success: false, error: 'Không tìm thấy file ảnh!' }

    // 🌟 ƯU TIÊN 1: Nếu đã cấu hình Vercel Blob (Chạy trên môi trường Vercel production)
    if (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID) {
      const blob = await put(`story-images/${Date.now()}-${file.name.replace(/\s+/g, '-')}`, file, {
        access: 'public',
      })
      return { success: true, url: blob.url }
    }

    // 🌟 FALLBACK 2: Nếu chưa cấu hình Token (Chạy offline ở localhost dưới máy của bạn)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const dirPath = path.join(process.cwd(), 'public', 'story-images')
    await fs.mkdir(dirPath, { recursive: true })

    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`
    const filePath = path.join(dirPath, fileName)

    await fs.writeFile(filePath, buffer)

    return { success: true, url: `/story-images/${fileName}` }
  } catch (error: any) {
    console.error("Lỗi upload ảnh:", error)
    return { success: false, error: error.message }
  }
}

/**
 * 🌟 ĐÃ CẬP NHẬT: TỰ ĐỘNG LƯU FILE ẢNH CMT LÊN CLOUD VERCEL BLOB NẾU CÓ TOKEN, FALLBACK LƯU LOCAL NẾU CHẠY OFFLINE
 */
export async function uploadCommentImage(formData: FormData) {
  // Chỉ yêu cầu đăng nhập, không yêu cầu là Admin
  const { userId } = await auth()
  if (!userId) return { success: false, error: 'Bạn cần đăng nhập để tải ảnh!' }

  try {
    const file = formData.get('file') as File
    if (!file) return { success: false, error: 'Không tìm thấy file ảnh!' }

    // 🌟 ƯU TIÊN 1: Nếu đã cấu hình Vercel Blob (Chạy trên môi trường Vercel production)
    if (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID) {
      const blob = await put(`comment-images/${Date.now()}-${file.name.replace(/\s+/g, '-')}`, file, {
        access: 'public',
      })
      return { success: true, url: blob.url }
    }

    // 🌟 FALLBACK 2: Nếu chưa cấu hình Token (Chạy offline ở localhost dưới máy của bạn)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Tạo thư mục riêng cho ảnh bình luận để dễ quản lý
    const dirPath = path.join(process.cwd(), 'public', 'comment-images')
    await fs.mkdir(dirPath, { recursive: true })

    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`
    const filePath = path.join(dirPath, fileName)

    await fs.writeFile(filePath, buffer)

    return { success: true, url: `/comment-images/${fileName}` }
  } catch (error: any) {
    console.error("Lỗi upload ảnh bình luận:", error)
    return { success: false, error: error.message }
  }
}

/**
 * ACTION LƯU HOẶC SỬA NỘI DUNG CHƯƠNG TRUYỆN
 */
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
    return { success: true }
  } catch (error: any) {
    console.error("Lỗi Postgres:", error)
    return { success: false, error: error.message }
  }
}

/**
 * ACTION LƯU HOẶC SỬA GIỚI THIỆU TRUYỆN
 */
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

/**
 * ACTION: CHỈNH SỬA TOÀN DIỆN THÔNG TIN TRUYỆN
 */
export async function updateFullStoryInfo(
  slug: string,
  data: { title: string; author: string; cover: string; description: string; link: string; genres: string }
) {
  const { userId } = await auth()
  if (!checkIsAdmin(userId)) return { success: false, error: 'Bạn không có quyền quản trị!' }

  try {
    // Cập nhật truyện mới trên bảng stories
    const dbStory = await sql`SELECT slug FROM stories WHERE slug = ${slug}`
    if (dbStory.rows.length > 0) {
      await sql`
        UPDATE stories 
        SET title = ${data.title}, author = ${data.author}, cover = ${data.cover}, 
            description = ${data.description}, link = ${data.link}, genres = ${data.genres}
        WHERE slug = ${slug}
      `
    }

    // Ghi đè vào bảng metadata (Áp dụng cho cả truyện gốc)
    await sql`
      INSERT INTO story_metadata (slug, title, author, cover, description, link, genres)
      VALUES (${slug}, ${data.title}, ${data.author}, ${data.cover}, ${data.description}, ${data.link}, ${data.genres})
      ON CONFLICT (slug)
      DO UPDATE SET 
        title = ${data.title}, author = ${data.author}, cover = ${data.cover}, 
        description = ${data.description}, link = ${data.link}, genres = ${data.genres}
    `
    return { success: true }
  } catch (err: any) {
    console.error("Lỗi cập nhật truyện:", err)
    return { success: false, error: err.message }
  }
}

// ==============================================================
// 🌟 CÁC LỆNH MỚI BỔ SUNG CHO TÍNH NĂNG CHIA QUYỂN (ACCORDION)
// ==============================================================

/**
 * ACTION: LẤY DANH SÁCH QUYỂN CỦA TRUYỆN
 */
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

/**
 * ACTION: THÊM / SỬA THANH CHIA QUYỂN
 */
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

/**
 * ACTION: XÓA THANH CHIA QUYỂN
 */
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

/**
 * ACTION: XÓA CHƯƠNG VÀ TỰ ĐỘNG DỒN SỐ CHƯƠNG PHÍA SAU LÊN (SHIFTING)
 */
export async function deleteChapter(storySlug: string, chapterNum: number) {
  const { userId } = await auth()
  if (!checkIsAdmin(userId)) {
    return { success: false, error: 'Bạn không có quyền quản trị!' }
  }

  try {
    // 1. Xóa nội dung chương mục tiêu trong chapter_contents
    await sql`
      DELETE FROM chapter_contents 
      WHERE story_slug = ${storySlug} AND chapter_number = ${chapterNum}
    `

    // 2. Dịch chuyển số chương của các chương sau lùi lại 1 đơn vị để tránh đứt quãng
    await sql`
      UPDATE chapter_contents 
      SET chapter_number = chapter_number - 1 
      WHERE story_slug = ${storySlug} AND chapter_number > ${chapterNum}
    `

    // 3. Cập nhật lại số lượng chương (chapter_count) trong database
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
      // Truyện tĩnh trong story_metadata
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

    // 4. Nếu có mốc phân quyển (volumes) bị ảnh hưởng, lùi mốc đó lại 1 đơn vị
    await sql`
      UPDATE story_volumes 
      SET start_chapter = start_chapter - 1 
      WHERE story_slug = ${storySlug} AND start_chapter > ${chapterNum}
    `
    // Nếu có quyển bắt đầu đúng tại chương bị xóa, xóa mốc quyển đó luôn (trừ quyển đầu tiên)
    await sql`
      DELETE FROM story_volumes 
      WHERE story_slug = ${storySlug} && start_chapter = ${chapterNum} AND start_chapter > 1
    `

    return { success: true }
  } catch (error: any) {
    console.error("Lỗi xóa chương:", error)
    return { success: false, error: error.message }
  }
}

/**
 * 🌟 ĐÃ THÊM: ACTION LƯU HÀNG LOẠT NỘI DUNG CHƯƠNG TỪ FILE ĐƯỢC UPLOAD LÊN
 */
export async function uploadChaptersFromText(storySlug: string, chapters: { number: number; title: string; content: string }[]) {
  const { userId } = await auth()
  if (!checkIsAdmin(userId)) return { success: false, error: 'Bạn không có quyền quản trị!' }

  try {
    // 1. Lưu tuần tự các chương vào database để tránh quá tải kết nối
    for (const ch of chapters) {
      // 🌟 PHÒNG VỆ: Tự động cắt ngắn tiêu đề chương phụ nếu bóc tách quá dài để tránh lỗi DB
      const safeChapterTitle = ch.title.trim().length > 250 
        ? ch.title.trim().slice(0, 247) + '...' 
        : ch.title.trim();

      await sql`
        INSERT INTO chapter_contents (story_slug, chapter_number, content, title)
        VALUES (${storySlug}, ${ch.number}, ${ch.content}, ${safeChapterTitle})
        ON CONFLICT (story_slug, chapter_number)
        DO UPDATE SET content = ${ch.content}, title = ${safeChapterTitle}
      `
    }

    // 2. Cập nhật lại tổng số lượng chương (chapter_count) trong bảng stories
    const nextChapterCount = chapters.length
    await sql`
      UPDATE stories 
      SET chapter_count = ${nextChapterCount} 
      WHERE slug = ${storySlug}
    `

    return { success: true }
  } catch (error: any) {
    console.error("Lỗi khi upload danh sách chương:", error)
    return { success: false, error: error.message }
  }
}