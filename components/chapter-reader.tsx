'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  List,
  Minus,
  Plus,
  Type,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useApp } from '@/components/favorites-provider'
import type { Chapter, Story } from '@/lib/stories'
import { cn } from '@/lib/utils'

export function ChapterReader({
  story,
  chapter,
}: {
  story: Story
  chapter: Chapter
}) {
  const { recordReading } = useApp()
  const router = useRouter()
  const [fontSize, setFontSize] = useState(18)

  const total = story.chapters.length
  const hasPrev = chapter.number > 1
  const hasNext = chapter.number < total

  useEffect(() => {
    recordReading(story.slug, chapter.number)
    const saved = window.localStorage.getItem('qt_fontsize')
    if (saved) setFontSize(Number(saved))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story.slug, chapter.number])

  useEffect(() => {
    window.localStorage.setItem('qt_fontsize', String(fontSize))
  }, [fontSize])

  function goTo(n: number) {
    router.push(`/truyen/${story.slug}/${n}`)
  }

  const Nav = ({ className }: { className?: string }) => (
    <div className={cn('flex items-center justify-between gap-2', className)}>
      <Button
        variant="outline"
        disabled={!hasPrev}
        onClick={() => hasPrev && goTo(chapter.number - 1)}
      >
        <ChevronLeft className="size-4" /> Chương trước
      </Button>
      <Select
        value={String(chapter.number)}
        onValueChange={(v) => goTo(Number(v))}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {story.chapters.map((c) => (
            <SelectItem key={c.number} value={String(c.number)}>
              Chương {c.number}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        disabled={!hasNext}
        onClick={() => hasNext && goTo(chapter.number + 1)}
      >
        Chương sau <ChevronRight className="size-4" />
      </Button>
    </div>
  )

  return (
    <article className="mx-auto w-full max-w-2xl">
      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/truyen/${story.slug}`}>
            <List className="size-4" /> Mục lục
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Type className="size-4 text-muted-foreground" />
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="Giảm cỡ chữ"
            onClick={() => setFontSize((s) => Math.max(14, s - 2))}
          >
            <Minus className="size-4" />
          </Button>
          <span className="w-8 text-center text-sm font-semibold">{fontSize}</span>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="Tăng cỡ chữ"
            onClick={() => setFontSize((s) => Math.min(28, s + 2))}
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      <header className="mb-6 text-center">
        <Link
          href={`/truyen/${story.slug}`}
          className="text-sm font-semibold text-primary hover:underline"
        >
          {story.title}
        </Link>
        <h1 className="mt-2 font-serif text-2xl font-bold md:text-3xl">
          {chapter.title}
        </h1>
      </header>

      <Nav className="mb-8" />

      <div
        className="flex flex-col gap-5 font-serif leading-loose text-foreground/90"
        style={{ fontSize }}
      >
        {chapter.content.map((p, i) => (
          <p key={i} className="text-pretty">
            {p}
          </p>
        ))}
      </div>

      <Nav className="mt-10" />
    </article>
  )
}
