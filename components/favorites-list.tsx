'use client'

import Link from 'next/link'
import { HeartOff, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StoryCard } from '@/components/story-card'
import { useApp } from '@/components/favorites-provider'
import { STORIES, getStory } from '@/lib/stories'

export function FavoritesList() {
  const { favorites, history, hydrated } = useApp()

  if (!hydrated) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[3/4] animate-pulse rounded-xl bg-muted"
          />
        ))}
      </div>
    )
  }

  const favStories = STORIES.filter((s) => favorites.includes(s.slug))
  const reading = history
    .map((h) => ({ progress: h, story: getStory(h.storySlug) }))
    .filter((x) => x.story)

  return (
    <div className="flex flex-col gap-12">
      <section>
        <h2 className="mb-4 font-serif text-2xl font-bold">
          Truyện yêu thích ({favStories.length})
        </h2>
        {favStories.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {favStories.map((s) => (
              <StoryCard key={s.slug} story={s} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-12 text-center">
            <HeartOff className="size-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              Bạn chưa thêm truyện nào vào yêu thích.
            </p>
            <Button asChild>
              <Link href="/truyen">Khám phá tủ truyện</Link>
            </Button>
          </div>
        )}
      </section>

      {reading.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 font-serif text-2xl font-bold">
            <History className="size-5 text-primary" />
            Đang đọc dở
          </h2>
          <div className="flex flex-col gap-2">
            {reading.map(({ progress, story }) => (
              <Link
                key={progress.storySlug}
                href={`/truyen/${progress.storySlug}/${progress.chapter}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary hover:bg-secondary"
              >
                <span className="font-semibold">{story!.title}</span>
                <span className="shrink-0 text-sm text-muted-foreground">
                  Đọc tiếp chương {progress.chapter} / {story!.chapters.length}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
