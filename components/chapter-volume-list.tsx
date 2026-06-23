'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, Trash2, Plus, Loader2, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { addOrUpdateVolume, deleteVolume, deleteChapter } from '@/app/actions/admin' // Bổ sung hàm deleteChapter
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Chapter {
  number: number
  title: string
}

interface Volume {
  start_chapter: number
  title: string
}

interface ChapterVolumeListProps {
  storySlug: string
  chapters: Chapter[]
  volumes: Volume[]
  isAdmin: boolean
}

export function ChapterVolumeList({ storySlug, chapters, volumes, isAdmin }: ChapterVolumeListProps) {
  const router = useRouter()
  
  const [isPending, setIsPending] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Lưu trữ dữ liệu đang sửa
  const [editVol, setEditVol] = useState({ startChapter: 1, title: 'Quyển 1: Bắt đầu' })

  // Thuật toán chia nhóm chương dựa trên mốc Quyển (Volumes)
  const groupedChapters = useMemo(() => {
    const groups: { start_chapter: number; title: string; chapters: Chapter[] }[] = []
    let currentGroup = { start_chapter: 1, title: 'Danh sách chương', chapters: [] as Chapter[] }

    const sortedVolumes = [...volumes].sort((a, b) => a.start_chapter - b.start_chapter)

    // Nếu có quyển bắt đầu từ chương 1, thay thế tên mặc định
    if (sortedVolumes.length > 0 && sortedVolumes[0].start_chapter === 1) {
      currentGroup.title = sortedVolumes[0].title
    }

    chapters.forEach((ch) => {
      // Kiểm tra xem chương hiện tại có trùng mốc đánh dấu Quyển mới không
      const matchingVol = sortedVolumes.find(v => v.start_chapter === ch.number)
      
      if (matchingVol && ch.number !== 1) {
        // Đóng gói quyển cũ lại
        if (currentGroup.chapters.length > 0) groups.push(currentGroup)
        // Mở quyển mới
        currentGroup = { start_chapter: matchingVol.start_chapter, title: matchingVol.title, chapters: [] }
      }
      
      currentGroup.chapters.push(ch)
    })
    
    // Đẩy quyển cuối cùng vào danh sách
    if (currentGroup.chapters.length > 0) groups.push(currentGroup)
      
    return groups
  }, [chapters, volumes])

  // Trạng thái Accordion (Mở/Gập) - Mặc định mở quyển đầu tiên
  const [openGroups, setOpenGroups] = useState<number[]>([groupedChapters[0]?.start_chapter])

  const toggleGroup = (startChapter: number) => {
    if (openGroups.includes(startChapter)) {
      setOpenGroups(openGroups.filter(id => id !== startChapter)) // Gập lại
    } else {
      setOpenGroups([...openGroups, startChapter]) // Mở ra
    }
  }

  // ==== PHẦN QUẢN LÝ QUYỂN (CHỈ ADMIN THẤY) ====
  const handleSaveVolume = async () => {
    setIsPending(true)
    try {
      const res = await addOrUpdateVolume(storySlug, Number(editVol.startChapter), editVol.title)
      if (res.success) {
        setIsModalOpen(false)
        router.refresh()
      } else alert("Lỗi: " + res.error)
    } finally { setIsPending(false) }
  }

  const handleDeleteVolume = async (startChap: number) => {
    if (!confirm("Xóa thanh chia quyển này? (Các chương bên trong vẫn an toàn)")) return
    setIsPending(true)
    try {
      const res = await deleteVolume(storySlug, startChap)
      if (res.success) router.refresh()
      else alert("Lỗi: " + res.error)
    } finally { setIsPending(false) }
  }

  // ==== PHẦN XÓA CHƯƠNG THÔNG MINH (CHỈ ADMIN THẤY) ====
  const handleDeleteChapterClick = async (chapterNumber: number, chapterTitle: string) => {
    const confirmDelete = confirm(
      `CẢNH BÁO CỰC KỲ QUAN TRỌNG:\n\nBạn có chắc chắn muốn XÓA VĨNH VIỄN "${chapterTitle}" không?\n\n` +
      `Lưu ý: Toàn bộ nội dung chữ của chương này sẽ bị xóa bỏ. Các chương phía sau chương này sẽ tự động được dồn số chương lùi lại 1 đơn vị để danh sách của bạn không bị đứt quãng.`
    )
    if (!confirmDelete) return

    setIsPending(true)
    try {
      const res = await deleteChapter(storySlug, chapterNumber)
      if (res.success) {
        alert("Đã xóa và sắp xếp lại các chương thành công!")
        router.refresh()
      } else {
        alert("Lỗi khi xóa chương: " + res.error)
      }
    } catch (err) {
      alert("Đã xảy ra sự cố khi xóa chương truyện!")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="w-full space-y-4 relative">
      
      {/* KHÓA MÀN HÌNH TẠM THỜI KHI ĐANG XỬ LÝ TRÁNH CLICK ĐÚP */}
      {isPending && (
        <div className="fixed inset-0 z-[100] bg-black/15 backdrop-blur-[1px] flex items-center justify-center">
          <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 flex items-center gap-3">
            <Loader2 className="size-5 animate-spin text-amber-800" />
            <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">Đang đồng bộ dữ liệu truyện...</span>
          </div>
        </div>
      )}

      {/* NÚT THÊM QUYỂN (DÀNH CHO ADMIN) */}
      {isAdmin && (
        <div className="flex justify-end mb-2">
          <Button 
            onClick={() => setIsModalOpen(true)} 
            variant="outline" 
            className="border-[#E5D8C8] text-[#8B5E3C] bg-[#F4EEE6]/40 hover:bg-[#F4EEE6] hover:text-[#5C3D2E] gap-1.5 h-8 text-xs rounded-xl"
          >
            <Plus className="size-4" /> Quản lý thanh chia quyển
          </Button>
        </div>
      )}

      {/* RENDER DANH SÁCH QUYỂN (ACCORDION) */}
      {groupedChapters.map((group) => {
        const isOpen = openGroups.includes(group.start_chapter)

        return (
          <div key={group.start_chapter} className="border border-[#E5D8C8]/60 dark:border-stone-800/60 rounded-2xl bg-[#FFFDFB] dark:bg-[#1a1412] shadow-sm overflow-hidden transition-all duration-300">
            
            {/* THANH TIÊU ĐỀ QUYỂN */}
            <div 
              onClick={() => toggleGroup(group.start_chapter)}
              className={cn(
                "flex items-center justify-between px-6 py-4 cursor-pointer transition group select-none animate-fade-in",
                isOpen ? "bg-[#F4EEE6]/30 dark:bg-stone-900/40" : "bg-transparent"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-[#F4EEE6]/80 dark:bg-stone-800 text-[#8B5E3C] dark:text-[#EADBC8] border border-[#E5D8C8]/40 dark:border-stone-700 transition group-hover:scale-105">
                  <BookOpen className="size-4" />
                </div>
                
                <h3 className="font-serif text-[16px] font-bold text-[#5C3D2E] dark:text-[#EADBC8] tracking-wide transition group-hover:text-[#8B5E3C]">
                  {group.title}
                </h3>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-stone-400 dark:text-stone-500 font-sans">
                  {group.chapters.length} chương
                </span>
                <div className="p-1.5 rounded-full bg-[#F4EEE6]/70 dark:bg-stone-800 text-[#5C3D2E] dark:text-stone-400 group-hover:bg-[#EADBC8] dark:group-hover:bg-stone-700 transition">
                  {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </div>
              </div>
            </div>

            {/* DANH SÁCH CHƯƠNG BÊN TRONG (CÓ HOVER XÓA) */}
            {isOpen && (
              <div className="p-5 border-t border-[#E5D8C8]/40 dark:border-stone-800/60 bg-[#FBF9F6]/40 dark:bg-transparent">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {group.chapters.map((ch) => (
                    <div key={ch.number} className="relative group w-full">
                      {/* Thẻ liên kết chương truyện */}
                      <Link
                        href={`/truyen/${storySlug}/${ch.number}`}
                        className={cn(
                          "flex items-center justify-center rounded-xl border border-[#E5D8C8]/60 dark:border-stone-800 bg-[#FFFDFB] dark:bg-stone-900 px-3 py-3 transition-all hover:border-[#8B5E3C] hover:text-[#8B5E3C] hover:bg-[#F4EEE6]/60 dark:hover:bg-stone-800/40 hover:shadow-sm w-full text-center",
                          isAdmin && "pr-9 text-left" // Nếu là Admin thì lùi lề phải vào 1 chút để nhường chỗ cho nút xóa xuất hiện
                        )}
                      >
                        <span className="text-[13px] font-bold uppercase tracking-wide text-[#5C3D2E]/80 dark:text-stone-300 line-clamp-1 text-center w-full">
                          {ch.title}
                        </span>
                      </Link>

                      {/* 🌟 NÚT XÓA CHƯƠNG KHI DI CHUỘT VÀO (CHỈ ADMIN THẤY) */}
                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.preventDefault() // Chặn sự kiện click nhảy trang của thẻ Link
                            e.stopPropagation() // Chặn nổi bọt sự kiện
                            handleDeleteChapterClick(ch.number, ch.title)
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/40 transition opacity-0 group-hover:opacity-100 shadow-sm border border-red-200/40 dark:border-red-900/30"
                          title={`Xóa vĩnh viễn ${ch.title}`}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* MODAL QUẢN LÝ QUYỂN (DÀNH CHO ADMIN) */}
      {isAdmin && isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-stone-900 p-6 shadow-2xl border border-stone-100 dark:border-stone-800">
            <h3 className="text-lg font-bold mb-4 border-b pb-2 text-stone-800 dark:text-stone-100">Tạo / Sửa thanh Quyển</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-500">Quyển này bắt đầu từ Chương số mấy?</label>
                <Input 
                  type="number" 
                  value={editVol.startChapter} 
                  onChange={(e) => setEditVol({...editVol, startChapter: parseInt(e.target.value) || 1})} 
                  className="mt-1 border-stone-200 dark:border-stone-800"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-500">Tên Quyển hiển thị (VD: Quyển 1: Bắt đầu)</label>
                <Input 
                  value={editVol.title} 
                  onChange={(e) => setEditVol({...editVol, title: e.target.value})} 
                  className="mt-1 uppercase border-stone-200 dark:border-stone-800"
                />
              </div>

              {/* Danh sách các quyển đang có để tiện xóa */}
              {volumes.length > 0 && (
                <div className="pt-4 mt-4 border-t border-stone-100 dark:border-stone-800">
                  <span className="text-xs font-semibold text-stone-500 mb-2 block">Các quyển hiện tại:</span>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {volumes.map(v => (
                      <div key={v.start_chapter} className="flex items-center justify-between bg-[#F4EEE6]/40 dark:bg-stone-800 p-2 rounded-lg text-xs">
                        <span className="font-medium text-stone-700 dark:text-stone-300">Chương {v.start_chapter}: {v.title}</span>
                        <button onClick={() => handleDeleteVolume(v.start_chapter)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 p-1 rounded-md transition"><Trash2 className="size-3.5"/></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-100 dark:border-stone-800">
                <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isPending}>Hủy</Button>
                <Button onClick={handleSaveVolume} disabled={isPending} className="bg-[#8B5E3C] hover:bg-[#5C3D2E] text-white rounded-xl transition-all">
                  {isPending && <Loader2 className="size-4 animate-spin mr-1.5" />} Lưu quyển
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}