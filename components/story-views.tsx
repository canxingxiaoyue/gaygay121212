'use client'

import { useState, useEffect } from 'react'
import { Eye, Loader2 } from 'lucide-react'
import { getStoryViews } from '@/app/actions/views'
import { formatViews } from '@/lib/stories'

export function StoryViews({ storySlug, baseViews = 0 }: { storySlug: string; baseViews?: number }) {
  const [views, setViews] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (storySlug) {
        const dbViews = await getStoryViews(storySlug)
        setViews(baseViews + dbViews)
      }
      setLoading(false)
    }
    load()
  }, [storySlug, baseViews])

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1">
        <Loader2 className="size-3 animate-spin text-stone-400" />
      </span>
    )
  }

  return <span>{formatViews(views)}</span>
}