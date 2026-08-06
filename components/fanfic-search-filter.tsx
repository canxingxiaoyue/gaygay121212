'use client'

import { useState, useMemo, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import type { Story } from '@/lib/stories'
import { StoryCard } from '@/components/story-card'
import { Search, X, Plus, Loader2, Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getManagedTags, addManagedTag, deleteManagedTag } from '@/app/actions/admin'
import { cn } from '@/lib/utils'

export function FanficSearchFilter({ 
  fanficStories, 
  initialGenre 
}: { 
  fanficStories: Story[]
  initialGenre?: string 
}) {
  const { user } = useUser()
  const router = useRouter()

  // NHẬN DIỆN ADMIN
  const isAdmin = !!(user?.id && user?.id === process.env.NEXT_PUBLIC_ADMIN_ID)

  // STATE QUẢN LÝ LỌC
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedFandoms, setSelectedFandoms] = useState<string[]>([])
  const [selectedShipdoms, setSelectedShipdoms] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState('')
  const [sortBy, setSortBy] = useState('views')

  // STATE NẠP TAG TỪ DATABASE
  const [dbFandoms, setDbFandoms] = useState<string[]>([])
  const [dbShipdoms, setDbShipdoms] = useState<string[]>([])
  const [dbGenres, setDbGenres] = useState<string[]>([])
  
  // 🌟 QUẢN LÝ 3 DANH SÁCH TAG BỊ ẨN RIÊNG BIỆT THEO TỪNG MỤC
  const [hiddenFandoms, setHiddenFandoms] = useState<string[]>([])
  const [hiddenShipdoms, setHiddenShipdoms] = useState<string[]>([])
  const [hiddenGenres, setHiddenGenres] = useState<string[]>([])

  // STATE THÊM TAG MỚI
  const [newTagInput, setNewTagInput] = useState('')
  const [isAddingTag, setIsAddingTag] = useState(false)

  // STATE TAB MẶC ĐỊNH
  const [activeTab, setActiveTab] = useState<'fandom' | 'shipdom' | 'status' | 'sort' | 'genre'>('fandom')

  // TẢI CÁC TAG ĐÃ LƯU VÀ CÁC TAG BỊ ẨN TỪ DATABASE
  const loadManagedTags = async () => {
    const res = await getManagedTags()
    setDbFandoms(res.fandoms || [])
    setDbShipdoms(res.shipdoms || [])
    setDbGenres(res.genres || [])
    
    setHiddenFandoms(res.hiddenFandoms || [])
    setHiddenShipdoms(res.hiddenShipdoms || [])
    setHiddenGenres(res.hiddenGenres || [])
  }

  useEffect(() => {
    loadManagedTags()
  }, [])

  // 🌟 KHỞI TẠO TỰ ĐỘNG MỞ ĐÚNG TAB VÀ BẬT SÁNG NÚT CHIP KHI BẤM TỪ TRANG CHI TIẾT TRUYỆN
  useEffect(() => {
    if (initialGenre && initialGenre.trim()) {
      const val = initialGenre.trim()
      
      if (dbShipdoms.some(s => s.toLowerCase() === val.toLowerCase()) || val.toLowerCase().includes('klein')) {
        setSelectedShipdoms([val])
        setActiveTab('shipdom')
      } else if (dbFandoms.some(f => f.toLowerCase() === val.toLowerCase())) {
        setSelectedFandoms([val])
        setActiveTab('fandom')
      } else {
        setSelectedGenres([val])
        setActiveTab('genre')
      }
    }
  }, [initialGenre, dbFandoms, dbShipdoms])

  // TRÍCH XUẤT VÀ GỘP CÁC TAG TỪ TRUYỆN + DATABASE
  const { allGenres, allTags } = useMemo(() => {
    const genreSet = new Set<string>()
    const tagSet = new Set<string>()

    fanficStories.forEach((s) => {
      (s.genres || []).forEach((g) => genreSet.add(g))
      ;(s.tags || []).forEach((t) => tagSet.add(t))
    })

    const rawGenres = Array.from(new Set([...Array.from(genreSet), ...dbGenres])).filter(Boolean).sort()
    const rawTags = Array.from(new Set([...Array.from(tagSet), ...dbFandoms, ...dbShipdoms])).filter(Boolean).sort()

    return {
      allGenres: rawGenres,
      allTags: rawTags,
    }
  }, [fanficStories, dbGenres, dbFandoms, dbShipdoms])

  // THÊM TAG MỚI DÀNH CHO ADMIN
  const handleAddTag = async () => {
    if (!newTagInput.trim()) return
    const tagType = activeTab === 'fandom' ? 'fandom' : activeTab === 'shipdom' ? 'shipdom' : 'genre'

    setIsAddingTag(true)
    try {
      const res = await addManagedTag(tagType, newTagInput.trim())
      if (res.success) {
        setNewTagInput('')
        await loadManagedTags()
        router.refresh()
      } else {
        alert("Lỗi thêm tag: " + res.error)
      }
    } finally {
      setIsAddingTag(false)
    }
  }

  // 🌟 XÓA TAG THEO QUY TẮC PHÂN QUYỀN MỤC
  const handleDeleteTag = async (type: 'fandom' | 'shipdom' | 'genre', name: string) => {
    const categoryName = type === 'fandom' ? 'Fandom' : type === 'shipdom' ? 'Shipdom' : 'Tất cả các mục'
    if (!confirm(`Bạn có chắc muốn xóa tag "${name}" khỏi mục ${categoryName}?`)) return
    
    try {
      const res = await deleteManagedTag(type, name)
      if (res.success) {
        // Cập nhật state hiển thị tức thì theo quy tắc từng mục
        if (type === 'fandom') setHiddenFandoms(prev => [...prev, name])
        if (type === 'shipdom') setHiddenShipdoms(prev => [...prev, name])
        if (type === 'genre') {
          // Xóa ở Tất cả thể loại -> Xóa đồng thời hết ở các mục
          setHiddenGenres(prev => [...prev, name])
          setHiddenFandoms(prev => [...prev, name])
          setHiddenShipdoms(prev => [...prev, name])
        }
        await loadManagedTags()
        router.refresh()
      } else {
        alert("Lỗi xóa tag: " + res.error)
      }
    } catch (e) {
      console.error(e)
    }
  }

  // CẤU HÌNH TÊN HIỂN THỊ TABS
  const TABS = [
    { 
      id: 'fandom', 
      label: selectedFandoms.length > 0 
        ? (selectedFandoms.length === 1 ? selectedFandoms[0] : `Fandom (${selectedFandoms.length})`) 
        : 'Tên fandom' 
    },
    { 
      id: 'shipdom', 
      label: selectedShipdoms.length > 0 
        ? (selectedShipdoms.length === 1 ? selectedShipdoms[0] : `Shipdom (${selectedShipdoms.length})`) 
        : 'Shipdom' 
    },
    { 
      id: 'status', 
      label: selectedStatus === 'ongoing' ? 'Đang tiến hành' : selectedStatus === 'completed' ? 'Hoàn thành' : selectedStatus === 'paused' ? 'Tạm ngưng' : 'Tất cả trạng thái' 
    },
    { 
      id: 'sort', 
      label: sortBy === 'newest' ? 'Mới cập nhật' : sortBy === 'rating' ? 'Đánh giá cao' : 'Đọc nhiều nhất' 
    },
    { 
      id: 'genre', 
      label: selectedGenres.length > 0 
        ? (selectedGenres.length === 1 ? selectedGenres[0] : `Thể loại (${selectedGenres.length})`) 
        : 'Tất cả thể loại' 
    }
  ] as const

  // 🌟 CẤU HÌNH DỮ LIỆU CÁC CHIP TRONG TỪNG TAB DỰA TRÊN QUY TẮC XÓA RIÊNG BẬT/TẮT
  const optionsMap: Record<string, string[]> = {
    fandom: [
      'Tất cả', 
      ...Array.from(new Set([...allTags, ...dbFandoms]))
        .filter(t => !hiddenFandoms.includes(t) && !hiddenGenres.includes(t))
    ],
    shipdom: [
      'Tất cả', 
      ...Array.from(new Set([...allTags, ...dbShipdoms]))
        .filter(t => !hiddenShipdoms.includes(t) && !hiddenGenres.includes(t))
    ],
    status: ['Tất cả', 'Đang tiến hành', 'Hoàn thành', 'Tạm ngưng'],
    sort: ['Đọc nhiều nhất', 'Mới cập nhật', 'Đánh giá cao'],
    genre: [
      'Tất cả', 
      ...allGenres.filter(g => !hiddenGenres.includes(g))
    ],
  }

  const isPillActive = (opt: string) => {
    if (activeTab === 'fandom') return opt === 'Tất cả' ? selectedFandoms.length === 0 : selectedFandoms.includes(opt)
    if (activeTab === 'shipdom') return opt === 'Tất cả' ? selectedShipdoms.length === 0 : selectedShipdoms.includes(opt)
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
    
    if (activeTab === 'fandom') {
      if (isAll) setSelectedFandoms([])
      else setSelectedFandoms(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt])
    }
    if (activeTab === 'shipdom') {
      if (isAll) setSelectedShipdoms([])
      else setSelectedShipdoms(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt])
    }
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
    return fanficStories
      .filter((story) => {
        const storyGenres = (story.genres || []).map(g => g.toLowerCase())
        const storyTagsAndGenres = [...(story.genres || []), ...(story.tags || [])].map(x => x.toLowerCase())

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

        if (selectedFandoms.length > 0) {
          const hasAllFandoms = selectedFandoms.every(sf => storyTagsAndGenres.includes(sf.toLowerCase()))
          if (!hasAllFandoms) return false
        }

        if (selectedShipdoms.length > 0) {
          const hasAllShipdoms = selectedShipdoms.every(ss => storyTagsAndGenres.includes(ss.toLowerCase()))
          if (!hasAllShipdoms) return false
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
  }, [fanficStories, searchTerm, selectedGenres, selectedFandoms, selectedShipdoms, selectedStatus, sortBy])

  return (
    <div className="space-y-6 font-sans text-left pb-16">
      
      {/* KHUNG BỘ LỌC CHÍNH */}
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

        {/* CÁC TAB CHUYỂN ĐỔI CHIP */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm">
          <span className="font-semibold text-stone-500 dark:text-stone-400 whitespace-nowrap">Lọc nhanh:</span>
          
          <div className="flex flex-wrap items-center gap-2">
            {TABS.map(tab => {
              const isActiveTab = activeTab === tab.id
              const hasSelection = tab.label !== 'Tên fandom' && 
                                   tab.label !== 'Shipdom' && 
                                   tab.label !== 'Tất cả trạng thái' && 
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

        {/* KHU VỰC CÁC CHIP (TAGS) DÀNH CHO FANFIC */}
        <div key={activeTab} className="flex flex-wrap items-center gap-2 pt-2 animate-in fade-in slide-in-from-top-1 duration-250 fill-mode-both">
          {optionsMap[activeTab].map((opt) => {
            const isActive = isPillActive(opt)
            const isAll = opt === 'Tất cả'
            
            const displayText = isAll 
              ? 'Tất cả' 
              : (activeTab === 'status' || activeTab === 'sort') 
                  ? opt 
                  : `+ ${opt}`

            return (
              <div key={opt} className="relative group inline-flex items-center">
                <button
                  type="button"
                  onClick={() => handleSelectOption(opt)}
                  className={cn(
                    "h-[36px] px-4 rounded-full text-[13px] font-semibold transition-all duration-200 select-none border flex items-center gap-1.5",
                    isActive
                      ? "bg-[#A45C12] text-white border-[#A45C12] shadow-md dark:bg-gradient-to-r dark:from-[#F4C27A] dark:to-[#D89A52] dark:border-[#D89A52] dark:text-[#241D18]"
                      : "bg-white dark:bg-[#31261F] border-[#EEDFD0] dark:border-white/10 text-stone-700 dark:text-[#E9D7C3] hover:border-[#D89A52] hover:text-[#A45C12] dark:hover:border-[#D89A52] dark:hover:text-[#F4C27A] hover:-translate-y-0.5 hover:shadow-sm"
                  )}
                >
                  <span>{displayText}</span>

                  {/* NÚT XÓA TAG DÀNH CHO ADMIN */}
                  {isAdmin && !isAll && (activeTab === 'fandom' || activeTab === 'shipdom' || activeTab === 'genre') && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteTag(activeTab, opt)
                      }}
                      className="opacity-0 group-hover:opacity-100 ml-1 p-0.5 rounded-full hover:bg-rose-500 hover:text-white transition-opacity cursor-pointer"
                      title={`Xóa tag "${opt}" khỏi ${activeTab === 'fandom' ? 'Fandom' : activeTab === 'shipdom' ? 'Shipdom' : 'Tất cả các mục'}`}
                    >
                      <X className="size-3" />
                    </span>
                  )}
                </button>
              </div>
            )
          })}

          {/* Ô NHẬP VÀ NÚT THÊM TAG MỚI DÀNH CHO ADMIN */}
          {isAdmin && (activeTab === 'fandom' || activeTab === 'shipdom' || activeTab === 'genre') && (
            <div className="inline-flex items-center gap-1.5 ml-2">
              <Input
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                placeholder={
                  activeTab === 'fandom' ? 'Thêm Fandom mới...' :
                  activeTab === 'shipdom' ? 'Thêm Shipdom mới...' : 'Thêm Thể loại mới...'
                }
                className="h-9 text-xs rounded-full border-[#EEDFD0] dark:border-white/10 bg-white dark:bg-[#1A1615] text-[#5A3823] dark:text-[#E9D7C3] w-36 sm:w-48 px-3.5 focus-visible:ring-[#D89A52]"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAddTag}
                disabled={isAddingTag}
                className="h-9 px-4 rounded-full bg-[#A45C12] hover:bg-[#8A490F] text-white text-xs font-bold shrink-0 shadow-xs"
              >
                {isAddingTag ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5 mr-1" />}
                Thêm
              </Button>
            </div>
          )}
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
            <p className="text-[#5A3823] dark:text-[#E9D7C3] text-[15px] font-bold">Không tìm thấy truyện Fanfic nào phù hợp.</p>
            <p className="text-stone-500 dark:text-stone-400 text-sm mt-1.5">Thử đổi lựa chọn hoặc bấm "Tất cả" xem sao nha!</p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('')
                setSelectedGenres([])
                setSelectedFandoms([])
                setSelectedShipdoms([])
                setSelectedStatus('')
                setSortBy('views')
                setActiveTab('fandom')
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