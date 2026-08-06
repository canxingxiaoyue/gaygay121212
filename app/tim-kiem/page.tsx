import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SearchFilterSection } from '@/components/search-filter-section' 
import { getMergedStories } from '@/app/actions/admin' 
import { Home, ChevronRight } from 'lucide-react'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; genre?: string; tag?: string }>
}) {
  // 🌟 LẤY THAM SỐ genre HOẶC tag TỪ URL
  const { q, genre, tag } = await searchParams
  const allStories = await getMergedStories(true) 

  // Lọc bỏ Fanfic
  const originalStories = allStories.filter(s => {
    const isFanfic = 
      (s.genres || []).some(g => g.toLowerCase().includes('fanfic') || g.toLowerCase().includes('đồng nhân')) ||
      (s.tags || []).some(t => t.toLowerCase().includes('fanfic') || t.toLowerCase().includes('đồng nhân'))
    
    return !isFanfic
  })

  return (
    <div className="flex min-h-screen flex-col bg-[#FDF8F1] dark:bg-[#1A1615] font-sans">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        
        {/* Breadcrumbs */}
        <nav className="mb-6 flex items-center gap-1 text-sm text-stone-500">
          <Link href="/" className="flex items-center gap-1 hover:text-[#8B5E3C]">
            <Home className="size-3.5" /> Trang chủ
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="text-stone-800 dark:text-stone-200 font-semibold">Tủ truyện</span>
        </nav>

        <header className="mb-8 flex flex-col items-center justify-center text-center">
          <h1 className="font-serif text-3xl font-bold text-[#5C3D2E] dark:text-[#EADBC8] md:text-4xl">
            Nguyên tác~
          </h1>
        </header>

        {/* 🌟 TRUYỀN THAM SỐ genre/tag XUỐNG BỘ LỌC */}
        <SearchFilterSection 
          originalStories={originalStories} 
          initialQ={q || ''} 
          initialGenre={genre || tag || ''} 
        />
        
      </main>
      <SiteFooter />
    </div>
  )
}