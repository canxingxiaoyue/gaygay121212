'use client'

import { useState, useEffect } from 'react'
import { Star, Loader2 } from 'lucide-react'
import { getStoryRating } from '@/app/actions/comments' // Gọi thông qua Server Action cực kỳ an toàn!

export function StoryRating({ storySlug, showCount }: { storySlug: string; showCount?: boolean }) {
  const [average, setAverage] = useState("0.0")
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (storySlug) {
        const res = await getStoryRating(storySlug)
        setAverage(res.average)
        setCount(res.count)
      }
      setLoading(false)
    }
    load()
  }, [storySlug])

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1">
        <Loader2 className="size-3 animate-spin text-stone-400" />
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1">
      <Star className="size-4 fill-amber-400 text-amber-400" />
      <span className="font-bold text-foreground">{average}</span>
      {showCount && (
        <span className="text-muted-foreground ml-1">({count} lượt đánh giá)</span>
      )}
    </span>
  )
}