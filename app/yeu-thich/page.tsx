import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { FavoritesList } from '@/components/favorites-list'
import { getMergedStories } from '@/app/actions/admin' // <-- Đã import hàm gộp truyện từ database

export default async function FavoritesPage() { // <-- Thêm async ở đây
  const allStories = await getMergedStories() // <-- Lấy danh sách truyện đã gộp cực kỳ chuẩn xác

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <header className="mb-6">
          <h1 className="font-serif text-3xl font-bold md:text-4xl text-stone-800 dark:text-stone-100">
            Tủ sách của bạn
          </h1>
          <p className="mt-1 text-stone-500">
            Những truyện bạn đã đánh dấu yêu thích và đang đọc dở.
          </p>
        </header>
        {/* Truyền toàn bộ danh sách truyện đã gộp từ Server xuống cho Client */}
        <FavoritesList allStories={allStories} />
      </main>
      <SiteFooter />
    </div>
  )
}