import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { FanficSearchFilter } from '@/components/fanfic-search-filter'
import { getMergedStories } from '@/app/actions/admin'
import { ChevronRight, Home } from 'lucide-react'

export default async function FanficPage() {
  // Lấy danh sách tất cả các truyện công khai
  const allStories = await getMergedStories(true)
  
  // Lọc các truyện thuộc dòng Fanfic / Đồng nhân
  const fanficStories = allStories.filter(s => 
    (s.genres || []).some(g => g.toLowerCase().includes('fanfic') || g.toLowerCase().includes('đồng nhân')) ||
    (s.tags || []).some(t => t.toLowerCase().includes('fanfic') || t.toLowerCase().includes('đồng nhân'))
  )

  return (
    <div className="flex min-h-screen flex-col bg-[#FDF8F1] dark:bg-stone-950 font-sans relative overflow-hidden">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 z-10 text-left">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1 text-sm text-stone-500">
          <Link href="/" className="flex items-center gap-1 hover:text-stone-800 dark:hover:text-stone-200">
            <Home className="size-3.5" /> Trang chủ
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="text-stone-800 font-semibold dark:text-stone-200">Fanfic</span>
        </nav>

        {/* Tiêu đề trang Góc Fanfic */}
        <div className="flex flex-col items-center justify-center mb-8 text-center">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#5C3D2E] dark:text-[#EADBC8]">
            Góc fanfic~
          </h1>
        </div>

        {/* 🌟 NHÚNG BỘ LỌC TÌM KIẾM FANFIC Y HỆT ÁNH 2 */}
        <FanficSearchFilter fanficStories={fanficStories} />
      </main>

      <SiteFooter />
    </div>
  )
}