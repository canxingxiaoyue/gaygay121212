import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { StoryCard } from '@/components/story-card'
import { getMergedStories } from '@/app/actions/admin' 
import { Home, ChevronRight, EyeOff } from 'lucide-react'
import { auth } from '@clerk/nextjs/server' // Bổ sung import kiểm tra người dùng

export default async function TruyenPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  
  // 1. Kiểm tra xem người đang truy cập có phải là Admin hay không
  const { userId } = await auth()
  const isAdmin = userId === process.env.NEXT_PUBLIC_ADMIN_ID

  // 2. 🌟 THUẬT TOÁN THÔNG MINH: 
  // - Nếu không phải Admin (!isAdmin -> true): Lọc bỏ truyện ẩn.
  // - Nếu là Admin (!isAdmin -> false): Nạp toàn bộ truyện kể cả truyện đang ẩn.
  const allStories = await getMergedStories(!isAdmin) 

  // Bộ lọc tìm kiếm truyện thông minh
  const filteredStories = q
    ? allStories.filter(
        (s) =>
          s.title.toLowerCase().includes(q.toLowerCase()) ||
          s.author.toLowerCase().includes(q.toLowerCase()) ||
          s.genres.some((g) => g.toLowerCase().includes(q.toLowerCase())),
      )
    : allStories

  return (
    <div className="flex min-h-screen flex-col bg-[#FDF8F1] dark:bg-transparent">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <nav className="mb-6 flex items-center gap-1 text-sm text-stone-500">
          <Link href="/" className="flex items-center gap-1 hover:text-stone-800">
            <Home className="size-3.5" /> Trang chủ
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="text-stone-800 font-semibold">Tủ truyện</span>
        </nav>

        <header className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-stone-800 dark:text-stone-100 md:text-4xl">
            {q ? `Kết quả tìm kiếm cho: "${q}"` : 'Tủ truyện của chủ nhà'}
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            {q
              ? `Tìm thấy ${filteredStories.length} bộ truyện phù hợp.`
              : 'Nơi lưu trữ tất cả các bộ truyện tại Tàn Tinh Hiểu Nguyệt.'}
          </p>
        </header>

        {filteredStories.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-4">
            {filteredStories.map((s) => (
              <div key={s.slug} className="relative group">
                {/* Render Thẻ truyện */}
                <StoryCard story={s} />
                
                {/* 🌟 Đóng dấu mác "Đang ẩn" màu đỏ dành riêng cho góc nhìn của Admin */}
                {isAdmin && (s as any).is_public === false && (
                  <div className="absolute top-2 right-2 z-10 bg-red-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1.5 rounded-lg shadow-md flex items-center gap-1.5 pointer-events-none">
                    <EyeOff className="size-3.5" /> Tạm ẩn
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-card rounded-2xl border border-stone-200/60 dark:border-stone-800/40">
            <p className="text-stone-500 italic">Không tìm thấy bộ truyện nào phù hợp.</p>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}