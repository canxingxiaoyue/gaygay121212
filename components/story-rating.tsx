'use client'

import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { getStoryRating } from '@/app/actions/comments'

export function StoryRating({ 
  storySlug, 
  showCount = false 
}: { 
  storySlug: string
  showCount?: boolean 
}) {
  const [average, setAverage] = useState("5.0")
  const [count, setCount] = useState(0)

  useEffect(() => {
    async function load() {
      if (storySlug) {
        const res = await getStoryRating(storySlug)
        
        // 🌟 BƯỚC FIX LỖI: Dùng .toFixed(1) để biến Số thành Chữ, tránh lỗi TypeScript
        setAverage(Number(res.average || 5).toFixed(1))
        setCount(res.count || 0)
      }
    }
    load()
  }, [storySlug])

  return (
    <div className="flex items-center gap-1 font-bold text-amber-600 dark:text-[#F4C27A]">
      <Star className="size-3.5 fill-amber-400 text-amber-400" />
      <span>{average}</span>
      {showCount && (
        <span className="text-stone-500 dark:text-stone-400 font-normal ml-0.5">
          ({count} lượt đánh giá)
        </span>
      )}
    </div>
  )
}