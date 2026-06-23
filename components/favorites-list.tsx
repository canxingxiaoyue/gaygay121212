'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { HeartOff, History, Loader2 } from 'lucide-react'
import { useUser } from '@clerk/nextjs' // Sử dụng Clerk để nhận diện tài khoản
import { getUserFavorites } from '@/app/actions/favorites' // Import hàm lấy yêu thích từ Database Vercel
import { Button } from '@/components/ui/button'
import { StoryCard } from '@/components/story-card'
import { useApp } from '@/components/favorites-provider'
import type { Story } from '@/lib/stories' // Import kiểu dữ liệu Story

export function FavoritesList({ allStories }: { allStories: Story[] }) { // <-- Nhận prop allStories từ trang cha truyền xuống
  const { user, isSignedIn } = useUser()
  const { history, hydrated } = useApp() // Giữ lại history và hydrated từ localStorage cũ

  const [dbFavorites, setDbFavorites] = useState<string[]>([])
  const [dbLoading, setDbLoading] = useState(true)

  // 1. Tải danh sách truyện yêu thích từ Vercel Postgres theo tài khoản đang đăng nhập của bạn
  useEffect(() => {
    async function load() {
      if (isSignedIn && user?.id) {
        const favs = await getUserFavorites(user.id)
        setDbFavorites(favs)
      } else {
        setDbFavorites([])
      }
      setDbLoading(false)
    }
    load()
  }, [isSignedIn, user?.id])

  // Trạng thái đang tải (Hiện bộ khung xương màu kem nhẹ nhàng)
  if (!hydrated || dbLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[3/4] animate-pulse rounded-xl bg-stone-100 dark:bg-stone-900"
          />
        ))}
      </div>
    )
  }

  // LỌC RA DANH SÁCH TRUYỆN YÊU THÍCH TỪ MẢNG TRUYỆN ĐÃ GỘP (allStories)
  const favStories = allStories.filter((s) => dbFavorites.includes(s.slug))
  
  // Lọc danh sách đang đọc dở từ mảng truyện đã gộp
  const reading = history
    .map((h) => ({ progress: h, story: allStories.find((s) => s.slug === h.storySlug) }))
    .filter((x) => x.story)

  return (
    <div className="flex flex-col gap-12">
      {/* PHẦN 1: TRUYỆN YÊU THÍCH (LẤY TỪ DATABASE VERCEL ĐỒNG BỘ VỚI TÀI KHOẢN) */}
      <section>
        <h2 className="mb-4 font-serif text-2xl font-bold text-stone-800 dark:text-stone-100">
          Truyện yêu thích ({favStories.length})
        </h2>
        {favStories.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {favStories.map((s) => (
              <StoryCard key={s.slug} story={s} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-stone-200 dark:border-stone-800 p-12 text-center bg-stone-50/50 dark:bg-stone-900/50">
            <HeartOff className="size-10 text-stone-400 dark:text-stone-600" />
            <p className="text-stone-500 dark:text-stone-400 font-medium text-sm">
              Bạn chưa thêm truyện nào vào yêu thích.
            </p>
            <Button asChild className="bg-amber-700 hover:bg-amber-800 text-white rounded-full">
              <Link href="/truyen">Khám phá tủ truyện</Link>
            </Button>
          </div>
        )}
      </section>

      {/* PHẦN 2: ĐANG ĐỌC DỞ (GIỮ NGUYÊN LƯU Ở LOCALSTORAGE) */}
      {reading.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 font-serif text-2xl font-bold text-stone-800 dark:text-stone-100">
            <History className="size-5 text-amber-700 dark:text-amber-400" />
            Đang đọc dở
          </h2>
          <div className="flex flex-col gap-2">
            {reading.map(({ progress, story }) => (
              <Link
                key={progress.storySlug}
                href={`/truyen/${progress.storySlug}/${progress.chapter}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-card px-4 py-3 transition-colors hover:border-amber-700 hover:bg-stone-50 dark:hover:bg-stone-900"
              >
                <span className="font-semibold text-stone-800 dark:text-stone-200">{story!.title}</span>
                <span className="shrink-0 text-sm text-stone-500 dark:text-stone-400">
                  Đọc tiếp chương {progress.chapter} / {story!.chapters.length}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}