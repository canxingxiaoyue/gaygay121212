import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { StoryBrowser } from '@/components/story-browser'

export default function CompletedPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <header className="mb-6">
          <h1 className="font-serif text-3xl font-bold md:text-4xl">
            Truyện đã hoàn thành
          </h1>
          <p className="mt-1 text-muted-foreground">
            Những bộ truyện đã trọn vẹn, bạn có thể đọc một mạch không lo chờ đợi.
          </p>
        </header>
        <StoryBrowser onlyCompleted />
      </main>
      <SiteFooter />
    </div>
  )
}
