'use client'

import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useApp } from '@/components/favorites-provider'

export function FavoriteButton({
  slug,
  variant = 'default',
  className,
}: {
  slug: string
  variant?: 'default' | 'icon'
  className?: string
}) {
  const { isFavorite, toggleFavorite, hydrated } = useApp()
  const active = hydrated && isFavorite(slug)

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          toggleFavorite(slug)
        }}
        aria-label={active ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
        className={cn(
          'flex size-9 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-background',
          className,
        )}
      >
        <Heart
          className={cn('size-4', active && 'fill-destructive text-destructive')}
        />
      </button>
    )
  }

  return (
    <Button
      type="button"
      variant={active ? 'default' : 'outline'}
      onClick={() => toggleFavorite(slug)}
      className={className}
    >
      <Heart className={cn('size-4', active && 'fill-current')} />
      {active ? 'Đã yêu thích' : 'Yêu thích'}
    </Button>
  )
}
