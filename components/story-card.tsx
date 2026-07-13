'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Eye, BookOpen } from 'lucide-react'
import { Story } from '@/lib/stories'
import { FavoriteButton } from '@/components/favorite-button'
import { StoryRating } from '@/components/story-rating'
import { StoryViews } from '@/components/story-views' // Import component kết nối Database

export function StoryCard({ story }: { story: Story }) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-md">
      {/* ẢNH BÌA CHẠM VIỀN TRÊN, TRÁI, PHẢI SIÊU MƯỢT MÀ NHƯ CŨ */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-100">
        <Link href={`/truyen/${story.slug}`} className="block h-full w-full">
          <Image
            src={story.cover || '/placeholder.svg'}
            alt={`Bìa truyện ${story.title}`}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform group-hover:scale-105 duration-300"
            priority
          />
        </Link>
        <div className="absolute right-2 top-2 z-10">
          {/* 🌟 ĐÃ SỬA: Thêm tùy chọn variant="icon" để nút tròn mờ ảo trên bìa */}
          <FavoriteButton storySlug={story.slug} variant="icon" />
        </div>
      </div>

      {/* CHỈ ÁP DỤNG PADDING CHO PHẦN CHỮ Ở DƯỚI */}
      <div className="flex flex-1 flex-col p-4 gap-1">
        <Link href={`/truyen/${story.slug}`} className="block">
          <h3 className="line-clamp-1 font-serif text-base font-bold text-foreground hover:text-primary transition-colors">
            {story.title}
          </h3>
        </Link>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {story.author}
        </p>

        {/* Thể loại */}
        <div className="flex flex-wrap gap-1 mt-1">
          {story.genres.slice(0, 2).map((g) => (
            <span key={g} className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
              {g}
            </span>
          ))}
        </div>

        {/* Đánh giá, Lượt xem, Số chương (ĐỒNG BỘ HOÀN TOÀN VỚI DATABASE VERCEL) */}
        <div className="mt-auto flex items-center gap-3 pt-3 text-[11px] text-muted-foreground border-t border-border mt-3">
          
          {/* Lấy điểm đánh giá trung bình thật */}
          <StoryRating storySlug={story.slug} />
          
          <span className="flex items-center gap-1">
            <Eye className="size-3.5" />
            {/* Lấy lượt xem thực tế thật */}
            <StoryViews storySlug={story.slug} baseViews={story.views} /> 
          </span>

          <span className="flex items-center gap-1">
            <BookOpen className="size-3.5" />
            {story.chapters.length}
          </span>
        </div>
      </div>
    </div>
  )
}