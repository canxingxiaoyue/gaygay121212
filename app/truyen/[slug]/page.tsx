import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Star, Eye, BookOpen, ChevronRight, Home } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ReadActions } from '@/components/read-actions'
import { CommentSection } from '@/components/comment-section'
import { STORIES, getStory, formatViews } from '@/lib/stories'

export function generateStaticParams() {
  return STORIES.map((s) => ({ slug: s.slug }))
}

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const story = getStory(slug)
  if (!story) notFound()

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <nav className="mb-5 flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/" className="flex items-center gap-1 hover:text-foreground">
            <Home className="size-3.5" /> Trang chủ
          </Link>
          <ChevronRight className="size-3.5" />
          <Link href="/truyen" className="hover:text-foreground">
            Tủ truyện
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground">{story.title}</span>
        </nav>

        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          <div className="relative mx-auto aspect-[3/4] w-full max-w-[260px] overflow-hidden rounded-xl border border-border shadow-md">
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
              <span className="mb-2 inline-block rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                {story.status}
              </span>
              <h1 className="font-serif text-3xl font-bold leading-tight md:text-4xl">
                {story.title}
              </h1>
              <p className="mt-1 text-muted-foreground">
                Tác giả: <span className="font-semibold text-foreground">{story.author}</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <Star className="size-4 fill-accent text-accent" />
                <span className="font-semibold">{story.rating}</span> / 5
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Eye className="size-4" /> {formatViews(story.views)} lượt đọc
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <BookOpen className="size-4" /> {story.chapters.length} chương
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {story.genres.map((g) => (
                <Link
                  key={g}
                  href={`/truyen?q=${encodeURIComponent(g)}`}
                  className="rounded-full border border-border px-3 py-1 text-sm font-medium hover:border-primary hover:text-primary"
                >
                  {g}
                </Link>
              ))}
            </div>

            <p className="text-pretty leading-relaxed text-foreground/90">
              {story.description}
            </p>

            <div className="flex flex-wrap gap-2">
              {story.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-md bg-accent/20 px-2.5 py-1 text-xs font-medium text-accent-foreground"
                >
                  #{t}
                </span>
              ))}
            </div>

            <ReadActions slug={story.slug} />
          </div>
        </div>

        {/* Chapter list */}
        <section className="mt-10">
          <h2 className="mb-4 font-serif text-2xl font-bold">
            Danh sách chương
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {story.chapters.map((ch) => (
              <Link
                key={ch.number}
                href={`/truyen/${story.slug}/${ch.number}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary hover:bg-secondary"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">
                  {ch.number}
                </span>
                <span className="line-clamp-1 text-sm font-medium">
                  {ch.title}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Comments */}
        <div className="mt-12">
          <CommentSection storySlug={story.slug} />
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
