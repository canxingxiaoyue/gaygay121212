import Link from 'next/link'
import Image from 'next/image'
import { Star, Eye, BookOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { FavoriteButton } from '@/components/favorite-button'
import { formatViews, type Story } from '@/lib/stories'

export function StoryCard({ story }: { story: Story }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg">
      <Link href={`/truyen/${story.slug}`} className="relative block aspect-[3/4] overflow-hidden">
        <Image
          src={story.cover || '/placeholder.svg'}
          alt={`Bìa truyện ${story.title}`}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute left-2 top-2">
          <Badge
            variant={story.status === 'Hoàn thành' ? 'default' : 'secondary'}
            className="shadow-sm"
          >
            {story.status}
          </Badge>
        </span>
      </Link>
      <div className="absolute right-2 top-2">
        <FavoriteButton slug={story.slug} variant="icon" />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link href={`/truyen/${story.slug}`}>
          <h3 className="line-clamp-1 font-serif text-base font-bold leading-tight group-hover:text-primary">
            {story.title}
          </h3>
        </Link>
        <p className="text-xs text-muted-foreground">{story.author}</p>
        <div className="flex flex-wrap gap-1">
          {story.genres.slice(0, 2).map((g) => (
            <span
              key={g}
              className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground"
            >
              {g}
            </span>
          ))}
        </div>
        <div className="mt-auto flex items-center gap-3 pt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="size-3.5 fill-accent text-accent" />
            {story.rating}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="size-3.5" />
            {formatViews(story.views)}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="size-3.5" />
            {story.chapters.length}
          </span>
        </div>
      </div>
    </article>
  )
}
