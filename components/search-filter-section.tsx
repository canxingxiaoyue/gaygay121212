'use client'

import { useState, useMemo, useEffect } from 'react'
import type { Story } from '@/lib/stories'
import { StoryCard } from '@/components/story-card'
import { Search, X, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SearchFilterSection({ 
  originalStories, 
  initialQ, 
  initialGenre 
}: { 
  originalStories: Story[]
  initialQ: string
  initialGenre?: string 
}) {
  const [searchTerm, setSearchTerm] = useState(initialQ)
  
  // 🌟 NẾU CÓ genre TỪ URL TRUYỀN VÀO THÌ KÍCH HOẠT SÁNG NÚT CHIP
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    initialGenre && initialGenre.trim() ? [initialGenre.trim()] : []
  )

  const [selectedStatus, setSelectedStatus] = useState('')
  const [sortBy, setSortBy] = useState('views')

  const [activeTab, setActiveTab] = useState<'genre' | 'status' | 'sort'>('genre')

  // ĐỒNG BỘ NẾU URL THAY ĐỔI
  useEffect(() => {
    setSearchTerm(initialQ)
  }, [initialQ])

  useEffect(() => {
    if (initialGenre && initialGenre.trim()) {
      setSelectedGenres([initialGenre.trim()])
      setActiveTab('genre') // Mở sẵn tab Tất cả thể loại
    }
  }, [initialGenre])

  // TRÍCH XUẤT THỂ LOẠI
  const { allGenres } = useMemo(() => {
    const genreSet = new Set<string>()
    originalStories.forEach((s) => {
      (s.genres || []).forEach((g) => genreSet.add(g))
    })
    return { allGenres: Array.from(genreSet).sort() }
  }, [originalStories])

  // CẤU HÌNH TABS
  const TABS = [
    { 
      id: 'genre', 
      label: selectedGenres.length > 0 
        ? (selectedGenres.length === 1 ? selectedGenres[0] : `Thể loại (${selectedGenres.length})`) 
        : 'Tất cả thể loại' 
    },
    { 
      id: 'status', 
      label: selectedStatus === 'ongoing' ? 'Đang tiến hành' : selectedStatus === 'completed' ? 'Hoàn thành' : selectedStatus === 'paused' ? 'Tạm ngưng' : 'Tất cả trạng thái' 
    },
    { 
      id: 'sort', 
      label: sortBy === 'newest' ? 'Mới cập nhật' : sortBy === 'rating' ? 'Đánh giá cao' : 'Đọc nhiều nhất' 
    }
  ] as const

  const optionsMap: Record<string, string[]> = {
    genre: ['Tất cả', ...allGenres],
    status: ['Tất cả', 'Đang tiến hành', 'Hoàn thành', 'Tạm ngưng'],
    sort: ['Đọc nhiều nhất', 'Mới cập nhật', 'Đánh giá cao'],
  }

  const isPillActive = (opt: string) => {
    if (activeTab === 'genre') return opt === 'Tất cả' ? selectedGenres.length === 0 : selectedGenres.includes(opt)
    if (activeTab === 'status') {
      if (opt === 'Tất cả' && !selectedStatus) return true
      if (opt === 'Đang tiến hành' && selectedStatus === 'ongoing') return true
      if (opt === 'Hoàn thành' && selectedStatus === 'completed') return true
      if (opt === 'Tạm ngưng' && selectedStatus === 'paused') return true
      return false
    }
    if (activeTab === 'sort') {
      if (opt === 'Đọc nhiều nhất' && sortBy === 'views') return true
      if (opt === 'Mới cập nhật' && sortBy === 'newest') return true
      if (opt === 'Đánh giá cao' && sortBy === 'rating') return true
      return false
    }
    return false
  }

  const handleSelectOption = (opt: string) => {
    const isAll = opt === 'Tất cả'
    if (activeTab === 'genre') {
      if (isAll) setSelectedGenres([])
      else setSelectedGenres(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt])
    }
    if (activeTab === 'status') {
      if (opt === 'Đang tiến hành') setSelectedStatus('ongoing')
      else if (opt === 'Hoàn thành') setSelectedStatus('completed')
      else if (opt === 'Tạm ngưng') setSelectedStatus('paused')
      else setSelectedStatus('')
    }
    if (activeTab === 'sort') {
      if (opt === 'Mới cập nhật') setSortBy('newest')
      else if (opt === 'Đánh giá cao') setSortBy('rating')
      else setSortBy('views')
    }
  }

  // THUẬT TOÁN LỌC
  const filtered = useMemo(() => {
    return originalStories
      .filter((story) => {
        const storyGenres = (story.genres || []).map(g => g.toLowerCase())

        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase().trim()
          const matchTitle = story.title.toLowerCase().includes(q)
          const matchAuthor = story.author.toLowerCase().includes(q)
          const matchDesc = (story.description || '').toLowerCase().includes(q)
          const matchGenres = storyGenres.some((g) => g.includes(q))
          const matchTags = (story.tags || []).some((t) => t.toLowerCase().includes(q))

          if (!matchTitle && !matchAuthor && !matchDesc && !matchGenres && !matchTags) return false
        }

        if (selectedGenres.length > 0) {
          const hasAllGenres = selectedGenres.every(sg => storyGenres.includes(sg.toLowerCase()))
          if (!hasAllGenres) return false
        }

        if (selectedStatus) {
          if (selectedStatus === 'ongoing' && story.status !== 'Đang ra') return false
          if (selectedStatus === 'completed' && story.status !== 'Hoàn thành') return false
          if (selectedStatus === 'paused' && story.status !== 'Tạm ngưng') return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'views') return (b.views || 0) - (a.views || 0)
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0)
        return 0 
      })
  }, [originalStories, searchTerm, selectedGenres, selectedStatus, sortBy])

  return (
    <div className="space-y-6 font-sans text-left pb-16">
      
      <div className="p-6 sm:p-7 rounded-[28px] border border-[#F2E8DC] dark:border-white/10 bg-white dark:bg-[#241D18] shadow-[0_8px_30px_rgba(80,50,20,0.06)] space-y-6">
        
        {/* Ô Nhập Tìm kiếm */}
        <div className="relative z-0">
          <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-stone-400 dark:text-stone-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên truyện, tác giả hoặc thể loại..."
            className="w-full h-[52px] rounded-[18px] border border-[#EEDFD0] dark:border-white/10 bg-white dark:bg-[#31261F] pl-12 pr-10 text-[15px] font-medium text-stone-800 dark:text-[#E9D7C3] placeholder:text-stone-400 focus:outline-none focus:border-[#D89A52] focus:ring-1 focus:ring-[#D89A52] transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 dark:hover:text-[#E9D7C3] transition-colors"
            >
              <X className="size-4.5" />
            </button>
          )}
        </div>

        {/* DÃY CÁC TAB CHUYỂN ĐỔI CHIP */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm">
          <span className="font-semibold text-stone-500 dark:text-stone-400 whitespace-nowrap">Lọc nhanh:</span>
          
          <div className="flex flex-wrap items-center gap-2">
            {TABS.map(tab => {
              const isActiveTab = activeTab === tab.id
              const hasSelection = tab.label !== 'Tất cả trạng thái' && 
                                   tab.label !== 'Đọc nhiều nhất' && 
                                   tab.label !== 'Tất cả thể loại'

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "h-[38px] px-4 rounded-full text-[13px] font-bold transition-all duration-200 select-none border",
                    isActiveTab
                      ? "bg-white dark:bg-[#241D18] border-[#D89A52] text-[#A45C12] dark:text-[#F4C27A] shadow-[0_2px_10px_rgba(216,154,82,0.15)]" 
                      : hasSelection
                        ? "bg-[#FFF9F4] dark:bg-[#3D2D23] border-[#D89A52]/40 text-[#A45C12] dark:text-[#F4C27A]" 
                        : "bg-white dark:bg-[#241D18] border-[#EEDFD0] dark:border-white/10 text-stone-600 dark:text-stone-400 hover:border-[#D89A52]/60 hover:text-[#A45C12] dark:hover:text-[#F4C27A]"
                  )}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* KHU VỰC CHIPS TÙY CHỌN */}
        <div key={activeTab} className="flex flex-wrap gap-2 pt-2 animate-in fade-in slide-in-from-top-1 duration-250 fill-mode-both">
          {optionsMap[activeTab].map((opt) => {
            const isActive = isPillActive(opt)
            const isAll = opt === 'Tất cả'
            
            const displayText = isAll 
              ? 'Tất cả' 
              : (activeTab === 'status' || activeTab === 'sort') 
                  ? opt 
                  : `+ ${opt}`

            return (
              <button
                key={opt}
                type="button"
                onClick={() => handleSelectOption(opt)}
                className={cn(
                  "h-[36px] px-4 rounded-full text-[13px] font-semibold transition-all duration-200 select-none border",
                  isActive
                    ? "bg-[#A45C12] text-white border-[#A45C12] shadow-md dark:bg-gradient-to-r dark:from-[#F4C27A] dark:to-[#D89A52] dark:border-[#D89A52] dark:text-[#241D18]"
                    : "bg-white dark:bg-[#31261F] border-[#EEDFD0] dark:border-white/10 text-stone-700 dark:text-[#E9D7C3] hover:border-[#D89A52] hover:text-[#A45C12] dark:hover:border-[#D89A52] dark:hover:text-[#F4C27A] hover:-translate-y-0.5 hover:shadow-sm"
                )}
              >
                {displayText}
              </button>
            )
          })}
        </div>
      </div>

      {/* SỐ KẾT QUẢ TÌM THẤY */}
      <div className="text-[15px] font-medium text-stone-600 dark:text-stone-400 px-1 pt-2">
        Tìm thấy <span className="font-bold text-[#A45C12] dark:text-[#F4C27A] text-lg">{filtered.length}</span> truyện
      </div>

      {/* DANH SÁCH LƯỚI TRUYỆN */}
      <div className="relative z-0">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {filtered.map((story) => (
              <StoryCard key={story.slug} story={story} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-[#241D18] rounded-[24px] border border-[#F2E8DC] dark:border-white/10 p-8 max-w-md mx-auto shadow-[0_8px_30px_rgba(80,50,20,0.06)]">
            <Sparkles className="size-8 text-[#D89A52] mx-auto mb-4 opacity-60" />
            <p className="text-[#5A3823] dark:text-[#E9D7C3] text-[15px] font-bold">Không tìm thấy truyện nguyên tác nào phù hợp.</p>
            <p className="text-stone-500 dark:text-stone-400 text-sm mt-1.5">Thử đổi lựa chọn hoặc bấm "Tất cả" xem sao nha!</p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('')
                setSelectedGenres([])
                setSelectedStatus('')
                setSortBy('views')
                setActiveTab('genre')
              }}
              className="mt-6 px-5 py-2.5 rounded-full bg-[#A45C12] text-white text-[13px] font-bold hover:bg-[#8A490F] shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              Đặt lại toàn bộ bộ lọc
            </button>
          </div>
        )}
      </div>
    </div>
  )
}