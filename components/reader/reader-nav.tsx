'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Story } from '@/lib/stories'
import { cn } from '@/lib/utils'

interface ReaderNavProps {
  story: Story
  currentChapterNumber: number
  goTo: (num: number) => void
  readerTheme: string
  THEME_MAPPING: Record<string, any>
  hasPrev: boolean
  hasNext: boolean
  className?: string // 🌟 Thêm prop className nhận dạng căn lề ngoài [MỚI]
}

export function ReaderNav({
  story,
  currentChapterNumber,
  goTo,
  readerTheme,
  THEME_MAPPING,
  hasPrev,
  hasNext,
  className, // 🌟 Nhận prop className [MỚI]
}: ReaderNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Tự động đóng Menu chọn chương khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // KHỐI LỆNH LỌC TÌM KIẾM CHƯƠNG THEO TEXT ĐẦU VÀO ĐỘNG
  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return story.chapters
    return story.chapters.filter((c) => {
      const title = c.title || `Chương ${c.number}`
      return title.toLowerCase().includes(searchQuery.toLowerCase())
    })
  }, [story.chapters, searchQuery])

  const currentChapter = story.chapters.find((c) => c.number === currentChapterNumber)

  return (
    <div className={cn("flex items-center justify-between gap-1.5 sm:gap-2 w-full select-none relative z-45", className)}> {/* 🌟 ĐỒNG BỘ ĐỘNG CLASSNAME Ở ĐÂY [MỚI] */}
      {/* Nút chương trước */}
      <Button
        variant="outline"
        disabled={!hasPrev}
        onClick={() => hasPrev && goTo(currentChapterNumber - 1)}
        className={cn(
          'h-10 px-2.5 sm:px-4 transition-all duration-200 font-semibold text-xs sm:text-sm shrink-0 rounded-full',
          THEME_MAPPING[readerTheme]?.navBtn
        )}
      >
        <ChevronLeft className="size-4 sm:mr-1 shrink-0" />
        <span className="hidden sm:inline">Chương trước</span>
        <span className="sm:hidden">Trước</span>
      </Button>

      {/* NÚT CHỌN CHƯƠNG ĐÃ ĐƯỢC CĂN GIỮA TUYỆT ĐỐI VÀ TÍCH HỢP TÌM KIẾM */}
      <div className="relative flex-1 max-w-[130px] sm:max-w-[200px]" ref={containerRef}>
        <button
          onClick={() => {
            setIsOpen(!isOpen)
            setSearchQuery('')
          }}
          className={cn(
            'w-full h-10 px-3.5 flex items-center justify-between border rounded-full font-semibold text-xs sm:text-sm transition-all duration-200 outline-none focus:outline-none',
            THEME_MAPPING[readerTheme]?.navBtn
          )}
        >
          <span className="truncate flex-1 text-center pr-1.5">
            {currentChapter?.title || `Chương ${currentChapterNumber}`}
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-60" />
        </button>

        {/* KHUNG DANH SÁCH CHƯƠNG MỜ ẢO THẢ XUỐNG DƯỚI */}
        {isOpen && (
          <div
            className={cn(
              'absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 p-3.5 rounded-[1.5rem] border shadow-2xl z-[200] flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-100',
              THEME_MAPPING[readerTheme]?.container
            )}
          >
            {/* Ô TÌM KIẾM CHƯƠNG ĐẦU MỤC LỤC */}
            <div className="relative flex items-center w-full">
              <Search className="absolute left-3 size-4 text-stone-400 dark:text-stone-500" />
              <Input
                type="text"
                placeholder="Nhập tên hoặc số chương..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8.5 pl-9 pr-3 text-xs rounded-full border border-stone-200 dark:border-stone-850 bg-stone-50/50 dark:bg-stone-950/20 text-stone-800 dark:text-stone-100 focus-visible:ring-amber-500 focus-visible:ring-1"
                autoFocus
              />
            </div>

            {/* KHU VỰC HIỂN THỊ DANH SÁCH CUỘN CHƯƠNG ĐÃ LỌC */}
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {filteredChapters.map((c) => (
                <button
                  key={c.number}
                  onClick={() => {
                    goTo(c.number)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm transition-colors duration-150 truncate block',
                    c.number === currentChapterNumber
                      ? (THEME_MAPPING[readerTheme]?.activeItem || 'bg-amber-100/70 text-amber-900 font-bold')
                      : 'hover:bg-stone-100/80 dark:hover:bg-stone-850/60 text-stone-700 dark:text-stone-300'
                  )}
                >
                  {c.title || `Chương ${c.number}`}
                </button>
              ))}

              {filteredChapters.length === 0 && (
                <p className="text-center text-xs text-stone-400 dark:text-stone-500 py-4 italic">
                  Không tìm thấy chương nào
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Nút chương sau */}
      <Button
        variant="outline"
        disabled={!hasNext}
        onClick={() => hasNext && goTo(currentChapterNumber + 1)}
        className={cn(
          'h-10 px-2.5 sm:px-4 transition-all duration-200 font-semibold text-xs sm:text-sm shrink-0 rounded-full',
          THEME_MAPPING[readerTheme]?.navBtn
        )}
      >
        <span className="hidden sm:inline">Chương sau</span>
        <span className="sm:hidden">Sau</span>
        <ChevronRight className="size-4 sm:ml-1 shrink-0" />
      </Button>
    </div>
  )
}