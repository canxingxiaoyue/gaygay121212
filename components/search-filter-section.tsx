'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StoryCard } from '@/components/story-card'
import type { Story } from '@/lib/stories'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SearchFilterSection({ allStories }: { allStories: Story[] }) {
  const [searchQuery, setSearchText] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all') // 🌟 Thêm State lọc trạng thái
  const [sortBy, setSortBy] = useState('popular')

  // BẮT THAM SỐ TỪ URL (Ví dụ: /tim-kiem?status=completed từ trang chủ)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const statusParam = params.get('status')
      if (statusParam === 'completed' || statusParam === 'ongoing') {
        setSelectedStatus(statusParam)
      }
    }
  }, [])

  // Quét toàn bộ truyện để lấy danh sách thể loại thực tế (dynamicGenres)
  const dynamicGenres = Array.from(
    new Set(allStories.flatMap((s) => s.genres))
  ).filter(Boolean)

  // LOGIC BỘ LỌC TÌM KIẾM VÀ SẮP XẾP VẠN NĂNG
  const filteredStories = allStories
    .filter((s) => {
      // 1. Tìm theo tên truyện, tác giả hoặc mô tả
      const matchesSearch =
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase())
      
      // 2. Lọc theo thể loại
      const matchesGenre =
        selectedGenre === 'all' || s.genres.includes(selectedGenre)

      // 3. 🌟 LOGIC PHÂN TÍCH TRẠNG THÁI (Kiểm tra cả status cứng lẫn các tag tự thêm thủ công)
      const isStoryCompleted =
        s.status === 'Hoàn thành' ||
        s.genres.some(g => g.toLowerCase().includes('hoàn thành')) ||
        s.genres.some(g => g.toLowerCase().includes('đã hoàn thành'))

      const matchesStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'completed' ? isStoryCompleted : !isStoryCompleted)

      return matchesSearch && matchesGenre && matchesStatus
    })
    .sort((a, b) => {
      // 4. Sắp xếp danh sách truyện
      if (sortBy === 'popular') return b.views - a.views
      if (sortBy === 'rating') return b.rating - a.rating
      return 0
    })

  return (
    <div className="space-y-6">
      {/* KHUNG TÌM KIẾM VÀ CHỌN BỘ LỌC */}
      <div className="bg-white dark:bg-card p-5 rounded-2xl border border-stone-200/60 dark:border-stone-800/40 shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Tìm theo tên truyện, tác giả hoặc thể loại..."
            className="pl-9 rounded-full border-stone-200 dark:border-stone-800 focus-visible:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-sm font-semibold text-stone-600 dark:text-stone-400">Lọc nhanh:</span>
          
          {/* Chọn thể loại */}
          <Select value={selectedGenre} onValueChange={setSelectedGenre}>
            <SelectTrigger className="w-[180px] rounded-full border-stone-200 dark:border-stone-800">
              <SelectValue placeholder="Tất cả thể loại" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả thể loại</SelectItem>
              {dynamicGenres.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 🌟 THÊM MỚI: Chọn trạng thái hoàn thành / đang tiến hành */}
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[180px] rounded-full border-stone-200 dark:border-stone-800">
              <SelectValue placeholder="Trạng thái truyện" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="completed">Đã hoàn thành</SelectItem>
              <SelectItem value="ongoing">Đang tiến hành</SelectItem>
            </SelectContent>
          </Select>

          {/* Chọn cách sắp xếp */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px] rounded-full border-stone-200 dark:border-stone-800">
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Đọc nhiều nhất</SelectItem>
              <SelectItem value="rating">Đánh giá cao nhất</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* CÁC NÚT BẤM CHỌN THỂ LOẠI NHANH DẠNG PILL TAGS ĐƯỢC TỰ ĐỘNG SINH RA */}
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            onClick={() => setSelectedGenre('all')}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
              selectedGenre === 'all'
                ? "bg-amber-800 border-amber-800 text-white animate-fade-in"
                : "border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:border-amber-800 hover:text-amber-800"
            )}
          >
            Tất cả
          </button>
          {dynamicGenres.map((g) => {
            const active = selectedGenre === g
            return (
              <button
                key={g}
                type="button"
                onClick={() => setSelectedGenre(g)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                  active
                    ? "bg-amber-800 border-amber-800 text-white"
                    : "border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:border-amber-800 hover:text-amber-800"
                )}
              >
                {g}
              </button>
            )
          })}
        </div>
      </div>

      <p className="text-sm font-semibold text-stone-600 dark:text-stone-400">
        Tìm thấy <span className="text-amber-800 dark:text-amber-400">{filteredStories.length}</span> truyện
      </p>

      {/* HIỂN THỊ DANH SÁCH TRUYỆN SAU KHI LỌC */}
      {filteredStories.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-4">
          {filteredStories.map((s) => (
            <StoryCard key={s.slug} story={s} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-card rounded-2xl border border-stone-200/60 dark:border-stone-800/40">
          <p className="text-stone-500 italic">Không tìm thấy truyện nào phù hợp. Bạn hãy thử bằng từ khóa khác nhé.</p>
        </div>
      )}
    </div>
  )
}