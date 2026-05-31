import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { StoryBrowser } from '@/components/story-browser'

export default async function TruyenPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <header className="mb-6">
          <h1 className="font-serif text-3xl font-bold md:text-4xl">Tủ truyện</h1>
          <p className="mt-1 text-muted-foreground">
            Tìm kiếm và lọc theo thể loại để chọn cuốn truyện hợp gu bạn nhất.
          </p>
        </header>
        <StoryBrowser initialQuery={q ?? ''} />
      </main>
      <SiteFooter />
    </div>
  )
}
