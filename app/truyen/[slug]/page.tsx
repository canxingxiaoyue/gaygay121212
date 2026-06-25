import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { sql } from '@vercel/postgres'
import { Eye, BookOpen, ChevronRight, Home } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { ReadActions } from '@/components/read-actions'
import { StoryRating } from '@/components/story-rating'
import { formatViews } from '@/lib/stories'
import { CommentSection } from '@/components/comment-section'
import { AddChapterButton } from '@/components/add-chapter-button' 
import { incrementViews, getStoryViews } from '@/app/actions/views'
import { getMergedStories, getStoryVolumes } from '@/app/actions/admin' // Bổ sung import getStoryVolumes
import { AdminStoryControls } from '@/components/admin-story-controls'
import { ChapterVolumeList } from '@/components/chapter-volume-list' // Import Component phân quyển gập mở mới
import { auth } from '@clerk/nextjs/server' 

// 🌟 ĐÃ SỬA: Lấy danh sách truyện từ Database để tạo đường dẫn tự động
export async function generateStaticParams() {
  const stories = await getMergedStories()
  if (!stories || stories.length === 0) return []
  return stories.map((s) => ({ slug: s.slug }))
}

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  
  // 1. Kiểm tra tài khoản Admin đăng nhập
  const { userId } = await auth()
  const ADMIN_ID = process.env.NEXT_PUBLIC_ADMIN_ID
  const isAdmin = userId && userId === ADMIN_ID

  // 2. Nạp truyện
  const allStories = await getMergedStories(false)
  const story = allStories.find((s) => s.slug === slug)
  if (!story) notFound()

  // 3. Bức tường bảo mật
  const isPublic = (story as any).is_public !== false
  if (!isPublic && !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-md flex-1 px-4 pt-20 pb-32 text-center font-sans">
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">Truyện tạm ẩn</h1>
          <p className="text-sm text-stone-500 mt-2">Truyện này đã được quản trị viên tạm thời ẩn khỏi chế độ công khai.</p>
          <Link href="/" className="mt-6 inline-block rounded-full bg-amber-800 hover:bg-amber-900 text-white px-5 py-2 text-sm font-semibold transition">
            Quay về trang chủ
          </Link>
        </main>
      </div>
    )
  }

  // 4. Lượt xem
  await incrementViews(slug)
  const dbViews = await getStoryViews(slug)
  const totalViews = (story.views || 0) + dbViews

  // 5. Lấy danh sách phân Quyển (Volumes) từ Database
  const volumes = await getStoryVolumes(slug)

  // 6. LẤY TOÀN BỘ TIÊU ĐỀ CHƯƠNG ĐÃ SỬA TỪ DATABASE
  let dbChapters: { chapter_number: number; title: string }[] = []
  try {
    const dbChaptersResult = await sql`
      SELECT chapter_number, title FROM chapter_contents 
      WHERE story_slug = ${slug}
    `
    dbChapters = dbChaptersResult.rows as any[]
  } catch (error) {
    console.error("Lỗi đọc dữ liệu chương từ Postgres:", error)
  }

  // 7. ĐỒNG BỘ TIÊU ĐỀ CHƯƠNG TỪ DATABASE VÀO DANH SÁCH GỐC
  const mergedChapters = story.chapters.map((ch) => {
    const dbMatch = dbChapters.find((dbc) => dbc.chapter_number === ch.number)
    return {
      ...ch,
      title: dbMatch?.title && dbMatch.title.trim() !== "" ? dbMatch.title : ch.title
    }
  })

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-32">
        <nav className="mb-5 flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/" className="flex items-center gap-1 hover:text-foreground">
            <Home className="size-3.5" /> Trang chủ
          </Link>
          <ChevronRight className="size-3.5" />
          <Link href="/truyen" className="hover:text-foreground">
            Tủ truyện
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground line-clamp-1">{story.title}</span>
        </nav>

        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          <div className="relative mx-auto aspect-[3/4] w-full max-w-[260px] overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800 shadow-md">
            <Image
              src={story.cover || '/placeholder.svg'}
              alt={`Bìa truyện ${story.title}`}
              fill
              sizes="260px"
              className="object-cover"
              priority
            />
          </div>

          <div className="flex flex-col gap-4">
            <div>
              {/* Đã xóa nhãn "Đang ra / Hoàn thành" ở đây */}
              <h1 className="font-serif text-3xl font-bold leading-tight md:text-4xl text-stone-800 dark:text-stone-100">
                {story.title}
              </h1>
              <p className="mt-1 text-stone-600 dark:text-stone-400">
                Tác giả: <span className="font-semibold text-stone-800 dark:text-stone-200">{story.author}</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {story.genres.map((g) => (
                <Link
                  key={g}
                  href={`/tim-kiem?genre=${encodeURIComponent(g)}`}
                  className="rounded-full border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 px-3 py-1 text-xs font-medium text-stone-600 dark:text-stone-400 hover:border-[#8B5E3C] hover:text-[#8B5E3C] transition-colors"
                >
                  {g}
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-stone-600 dark:text-stone-400">
              <div className="flex items-center gap-1.5">
                <StoryRating storySlug={story.slug} showCount />
                <span>/ 5</span>
              </div>
              <span className="flex items-center gap-1.5">
                <Eye className="size-4" /> {formatViews(totalViews)} lượt đọc
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="size-4" /> {story.chapters.length} chương
              </span>
            </div>

            {/* Hiển thị tĩnh nội dung Giới thiệu và Link */}
            <div className="mt-2 space-y-4">
              <div className="text-sm leading-relaxed text-stone-700 dark:text-stone-300 whitespace-pre-line text-pretty">
                {story.description}
              </div>
              
              {story.link && (
                <div className="text-sm font-medium text-stone-600 dark:text-stone-400">
                  Link bản gốc: <a href={story.link} target="_blank" rel="noopener noreferrer" className="text-amber-700 dark:text-amber-500 hover:underline font-bold">Tại đây</a>
                </div>
              )}
            </div>

            <ReadActions slug={story.slug} />
          </div>
        </div>

        {/* 🌟 Gắn Component Bảng Điều Khiển Truyền Đầy Đủ Object Truyện */}
        {isAdmin && (
          <AdminStoryControls story={story} />
        )}

        {/* KHU VỰC DANH SÁCH CHƯƠNG ĐÃ ĐƯỢC PHÂN QUYỂN GẬP MỞ */}
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="font-serif text-2xl font-bold text-stone-800 dark:text-stone-100">
              Danh sách chương
            </h2>
            <AddChapterButton storySlug={story.slug} currentCount={story.chapters.length} />
          </div>

          {/* GỌI COMPONENT PHÂN QUYỂN THẢ XUỐNG */}
          <ChapterVolumeList 
            storySlug={story.slug}
            chapters={mergedChapters}
            volumes={volumes}
            isAdmin={!!isAdmin}
          />
        </section>

        <CommentSection storySlug={story.slug} />
      </main>
    </div>
  )
}