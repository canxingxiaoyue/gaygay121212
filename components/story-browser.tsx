'use client'

import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StoryCard } from '@/components/story-card'
import { GENRES, STORIES } from '@/lib/stories'
import { cn } from '@/lib/utils'

type Props = {
  initialQuery?: string
  onlyCompleted?: boolean
}

export function StoryBrowser({ initialQuery = '', onlyCompleted = false }: Props) {
  const [query, setQuery] = useState(initialQuery)
  const [genre, setGenre] = useState<string>('all')
  const [status, setStatus] = useState<string>(
    onlyCompleted ? 'Hoàn thành' : 'all',
  )
  const [sort, setSort] = useState<string>('popular')

  const results = useMemo(() => {
    let list = STORIES.filter((s) => {
      const q = query.trim().toLowerCase()
      const matchQuery =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.author.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
      const matchGenre = genre === 'all' || s.genres.includes(genre)
      const matchStatus = status === 'all' || s.status === status
      return matchQuery && matchGenre && matchStatus
    })

    list = [...list].sort((a, b) => {
      if (sort === 'popular') return b.views - a.views
      if (sort === 'rating') return b.rating - a.rating
      if (sort === 'chapters') return b.chapters.length - a.chapters.length
      return a.title.localeCompare(b.title, 'vi')
    })
    return list
  }, [query, genre, status, sort])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên truyện, tác giả hoặc thẻ..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <SlidersHorizontal className="size-4" /> Lọc:
          </span>
          <Select value={genre} onValueChange={setGenre}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Thể loại" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả thể loại</SelectItem>
              {GENRES.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!onlyCompleted && (
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Mọi trạng thái</SelectItem>
                <SelectItem value="Đang ra">Đang ra</SelectItem>
                <SelectItem value="Hoàn thành">Hoàn thành</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Đọc nhiều nhất</SelectItem>
              <SelectItem value="rating">Đánh giá cao</SelectItem>
              <SelectItem value="chapters">Nhiều chương</SelectItem>
              <SelectItem value="title">Theo tên (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quick genre chips */}
        <div className="flex flex-wrap gap-2">
          <GenreChip active={genre === 'all'} onClick={() => setGenre('all')}>
            Tất cả
          </GenreChip>
          {GENRES.map((g) => (
            <GenreChip key={g} active={genre === g} onClick={() => setGenre(g)}>
              {g}
            </GenreChip>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Tìm thấy <span className="font-semibold text-foreground">{results.length}</span> truyện
      </p>

      {results.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {results.map((s) => (
            <StoryCard key={s.slug} story={s} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          Không tìm thấy truyện nào phù hợp. Thử từ khóa khác nhé.
        </div>
      )}
    </div>
  )
}

function GenreChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-sm font-medium transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}
