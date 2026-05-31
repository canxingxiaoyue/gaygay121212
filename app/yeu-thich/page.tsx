import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { FavoritesList } from '@/components/favorites-list'

export default function FavoritesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <header className="mb-6">
          <h1 className="font-serif text-3xl font-bold md:text-4xl">
            Tủ sách của bạn
          </h1>
          <p className="mt-1 text-muted-foreground">
            Những truyện bạn đã đánh dấu yêu thích và đang đọc dở.
          </p>
        </header>
        <FavoritesList />
      </main>
      <SiteFooter />
    </div>
  )
}
