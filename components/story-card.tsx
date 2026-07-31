'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart, Eye, BookOpen, Star } from 'lucide-react'
import type { Story } from '@/lib/stories'
import { cn } from '@/lib/utils'

export function StoryCard({ story }: { story: Story }) {
  const isHidden = (story as any).is_public === false

  return (
    <Link
      href={`/truyen/${story.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-[22px] border border-stone-200/80 dark:border-white/10 bg-[#FFFDFB] dark:bg-[#221C1A] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:hover:border-[#D89A52]/80 dark:hover:shadow-[0_8px_25px_rgba(216,154,82,0.12)] select-none"
    >
      {/* 🌟 HUY HIỆU TẠM ẨN DÀNH RIÊNG CHO ADMIN XEM [MỚI] */}
      {isHidden && (
        <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1 rounded-full bg-red-950/80 backdrop-blur-md border border-red-500/40 px-2.5 py-0.5 text-[10px] font-bold text-red-300 shadow-sm">
          <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
          <span>Tạm ẩn</span>
        </div>
      )}

      {/* KHUNG ẢNH BÌA TRÀN VIỀN */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-100 dark:bg-[#1A1615]">
        <Image
          src={story.cover || '/placeholder.svg'}
          alt={`Bìa truyện ${story.title}`}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        
        {/* Nút yêu thích góc trên */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
          }}
          className="absolute top-2.5 right-2.5 flex size-8 items-center justify-center rounded-full bg-black/30 backdrop-blur-md text-white transition-transform active:scale-90 hover:bg-black/50 z-20"
        >
          <Heart className="size-4" />
        </button>
      </div>

      {/* NỘI DUNG THÔNG TIN TRUYỆN */}
      <div className="flex flex-1 flex-col p-4 text-left font-sans">
        <h3 className="font-serif text-base font-bold text-stone-800 dark:text-[#E9D7C3] line-clamp-1 group-hover:text-amber-800 dark:group-hover:text-[#F4C27A] transition-colors">
          {story.title}
        </h3>

        <p className="mt-1 text-xs text-stone-500 dark:text-[#B59C86] line-clamp-1 font-medium">
          {story.author || 'Ẩn danh'}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {(story.genres || []).slice(0, 2).map((genre) => (
            <span
              key={genre}
              className="rounded-lg bg-stone-100 dark:bg-[#322824] border border-stone-200/60 dark:border-[#D89A52]/30 px-2.5 py-0.5 text-[10.5px] font-semibold text-stone-600 dark:text-[#F4C27A]"
            >
              {genre}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-3 flex items-center justify-between text-[11px] border-t border-stone-100 dark:border-white/10">
          <div className="flex items-center gap-1 font-bold text-amber-600 dark:text-[#F4C27A]">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            <span>{story.rating ? Number(story.rating).toFixed(1) : "5.0"}</span>
          </div>

          <div className="flex items-center gap-3 text-stone-500 dark:text-[#B59C86] font-medium">
            <span className="flex items-center gap-1">
              <Eye className="size-3 text-stone-400 dark:text-[#B59C86]" />
              <span className="dark:text-[#E9D7C3]">{story.views || 0}</span>
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="size-3 text-stone-400 dark:text-[#B59C86]" />
              <span className="dark:text-[#E9D7C3]">{story.chapters?.length || (story as any).chapter_count || 0}</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}