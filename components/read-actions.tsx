'use client'

import Link from 'next/link'
import { BookOpen, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FavoriteButton } from '@/components/favorite-button'
import { useApp } from '@/components/favorites-provider'

export function ReadActions({ slug }: { slug: string }) {
  const { getProgress, hydrated } = useApp()
  const progress = hydrated ? getProgress(slug) : undefined

  return (
    <div className="flex flex-wrap gap-3">
      <Button asChild size="lg">
        <Link href={`/truyen/${slug}/1`}>
          <BookOpen className="size-4" />
          Đọc từ đầu
        </Link>
      </Button>
      {progress && (
        <Button asChild size="lg" variant="secondary">
          <Link href={`/truyen/${slug}/${progress.chapter}`}>
            <History className="size-4" />
            Đọc tiếp chương {progress.chapter}
          </Link>
        </Button>
      )}
      <FavoriteButton slug={slug} />
    </div>
  )
}
