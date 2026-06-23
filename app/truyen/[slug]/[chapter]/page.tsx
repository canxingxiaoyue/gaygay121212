import fs from 'fs'
import path from 'path'
import Link from 'next/link' // Bổ sung import Link
import { notFound } from 'next/navigation'
import { sql } from '@vercel/postgres'
import { auth } from '@clerk/nextjs/server'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ChapterReader } from '@/components/reader'
import { STORIES } from '@/lib/stories' // Giữ lại STORIES cho generateStaticParams
import { getMergedStories } from '@/app/actions/admin' // Import hàm gộp truyện từ DB
import { incrementViews } from '@/app/actions/views'

export function generateStaticParams() {
  return STORIES.flatMap((s) =>
    s.chapters.map((c) => ({ slug: s.slug, chapter: String(c.number) })),
  )
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ slug: string; chapter: string }>
}) {
  const { slug, chapter } = await params

  // 1. Kiểm tra quyền Admin TỪ SỚM để dùng cho bức tường bảo mật
  const { userId } = await auth()
  const adminId = (process.env.NEXT_PUBLIC_ADMIN_ID || '').replace(/['"]/g, '')
  const isAdmin = userId === adminId
  
  // 2. Tự động tìm kiếm gộp từ cả stories.ts và database (truyền false để nạp cả truyện ẩn)
  const allStories = await getMergedStories(false)
  const story = allStories.find((s) => s.slug === slug)
  
  const chapterNum = Number(chapter)
  const found = story?.chapters.find((c) => c.number === chapterNum)
  if (!story || !found) notFound()

  // 3. 🌟 BỨC TƯỜNG BẢO MẬT: Chặn đọc chương nếu truyện đã bị tạm ẩn
  const isPublic = (story as any).is_public !== false
  if (!isPublic && !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FBF7F0] dark:bg-stone-950">
        <SiteHeader />
        <main className="mx-auto w-full max-w-md flex-1 px-4 pt-32 pb-32 text-center font-sans">
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">Chương truyện tạm ẩn</h1>
          <p className="text-sm text-stone-500 mt-2">Truyện này đang được bảo trì hoặc đã bị quản trị viên tạm ẩn khỏi hệ thống.</p>
          <Link href="/" className="mt-6 inline-block rounded-full bg-amber-800 hover:bg-amber-900 text-white px-5 py-2 text-sm font-semibold transition">
            Quay về trang chủ
          </Link>
        </main>
        <SiteFooter />
      </div>
    )
  }

  // 4. Tăng lượt xem thực tế (CHỈ KHI ĐÃ LỌT QUA ĐƯỢC BỨC TƯỜNG BẢO MẬT MỚI TÍNH VIEW)
  await incrementViews(slug)

  let dbResult: any = null // <-- KHAI BÁO RỘNG BIẾN DB_RESULT Ở ĐÂY ĐỂ TRÁNH LỖI BLOCK-SCOPE
  let paragraphArray: string[] = []
  let chapterTitle = found.title // Mặc định dùng tên chương cũ

  try {
    // 5. ƯU TIÊN ĐỌC TỪ DATABASE TRƯỚC (CÓ CẢ CONTENT VÀ TITLE)
    dbResult = await sql`
      SELECT content, title FROM chapter_contents 
      WHERE story_slug = ${slug} AND chapter_number = ${chapterNum}
      LIMIT 1
    `

    if (dbResult && dbResult.rows.length > 0) {
      const dbContent = dbResult.rows[0].content
      const dbTitle = dbResult.rows[0].title
      
      if (dbTitle) chapterTitle = dbTitle // Nếu database có lưu tiêu đề đã sửa, dùng tiêu đề đó
      
      // Chuyển nội dung HTML thành một phần tử duy nhất trong mảng để Reader render gọn gàng
      paragraphArray = [dbContent]
    } else {
      // 6. FALLBACK: ĐỌC TỪ FILE .TXT NHƯ CŨ
      let filePath = path.join(process.cwd(), 'public', 'chapters', slug, `vong-tron-${chapterNum}.txt`)
      if (!fs.existsSync(filePath)) {
        filePath = path.join(process.cwd(), 'public', 'chapters', slug, `${chapterNum}.txt`)
      }

      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8')
        // Tách các đoạn văn bằng Enter và bọc chúng lại
        paragraphArray = fileContent.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
      } else {
        // Nội dung hiển thị mẫu nếu cả DB và file .txt tĩnh đều chưa được tạo
        paragraphArray = [
          `Nội dung chương ${chapterNum} chưa được cập nhật.`,
          `Bạn có thể đăng nhập bằng tài khoản Admin để bắt đầu viết nội dung trực tiếp trên trang này!`
        ]
      }
    }
  } catch (error) {
    paragraphArray = ['Đã xảy ra lỗi trong quá trình đọc nội dung chương truyện.']
  }

  // 7. KIỂM TRA MỐC TÀNG HÌNH: Đã kiểm tra an toàn biến dbResult tồn tại trước khi đọc rows
  const isPlaceholder = (!dbResult || !dbResult.rows.length) && !fs.existsSync(path.join(process.cwd(), 'public', 'chapters', slug, `vong-tron-${chapterNum}.txt`)) && !fs.existsSync(path.join(process.cwd(), 'public', 'chapters', slug, `${chapterNum}.txt`))

  // Nạp tiêu đề mới, nội dung và mốc isPlaceholder vào object chapter
  const chapterWithContent = {
    ...found,
    title: chapterTitle,
    content: paragraphArray,
    isPlaceholder: isPlaceholder,
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 px-4 py-8">
        {/* Truyền thêm prop isAdmin lấy trực tiếp từ Server xuống */}
        <ChapterReader story={story} chapter={chapterWithContent as any} isAdmin={isAdmin} />
      </main>
      <SiteFooter />
    </div>
  )
}