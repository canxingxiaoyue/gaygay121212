import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SearchFilterSection } from '@/components/search-filter-section' 
import { getMergedStories } from '@/app/actions/admin' 
import { Home, ChevronRight } from 'lucide-react'

export default async function SearchPage() {
  // 🌟 Chỉ lấy các truyện công khai để hiển thị trên bộ lọc tìm kiếm
  const allStories = await getMergedStories(true) 

  return (
    <div className="flex min-h-screen flex-col bg-[#FDF8F1] dark:bg-transparent">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <nav className="mb-6 flex items-center gap-1 text-sm text-stone-500">
          <Link href="/" className="flex items-center gap-1 hover:text-stone-800">
            <Home className="size-3.5" /> Trang chủ
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="text-stone-800 font-semibold">Tìm kiếm</span>
        </nav>

        <header className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-stone-800 dark:text-stone-100 md:text-4xl">
            Tìm kiếm truyện tại quán
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Tìm kiếm, tra cứu và lọc tất cả các bộ truyện tại Tàn Tinh Hiểu Nguyệt.
          </p>
        </header>

        {/* Gọi bộ lọc tìm kiếm vạn năng và truyền danh sách truyện đã gộp xuống */}
        <SearchFilterSection allStories={allStories} />
      </main>
      <SiteFooter />
    </div>
  )
}