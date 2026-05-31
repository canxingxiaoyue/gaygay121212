import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ChapterReader } from '@/components/chapter-reader'
import { STORIES, getStory } from '@/lib/stories'

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
  const story = getStory(slug)
  const chapterNum = Number(chapter)
  const found = story?.chapters.find((c) => c.number === chapterNum)
  if (!story || !found) notFound()

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 px-4 py-8">
        <ChapterReader story={story} chapter={found} />
      </main>
      <SiteFooter />
    </div>
  )
}
