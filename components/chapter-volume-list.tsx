'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Plus, 
  Loader2, 
  BookOpen, 
  Edit2, 
  XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  addOrUpdateVolume, 
  deleteVolume, 
  deleteChapter, 
  bulkDeleteChapters 
} from '@/app/actions/admin'
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

interface VolumeData {
  volume_number: number
  volume_name: string
  description?: string
  end_chapter?: number
}

// HÀM BÓC TÁCH THÔNG MINH
function parseVolumeTitle(dbTitle: string): VolumeData {
  try {
    if (dbTitle.startsWith('{') && dbTitle.endsWith('}')) {
      return JSON.parse(dbTitle) as VolumeData
    }
  } catch (e) {}
  
  const match = dbTitle.match(/Quyển\s+(\d+)[\s:\-]*(.*)/i)
  if (match) {
    return {
      volume_number: parseInt(match[1], 10) || 1,
      volume_name: dbTitle
    }
  }
  return {
    volume_number: 1,
    volume_name: dbTitle
  }
}

// HÀM HIỂN THỊ TÊN ĐỘNG
function getVolumeDisplayName(dbTitle: string): string {
  try {
    if (dbTitle.startsWith('{') && dbTitle.endsWith('}')) {
      const data = JSON.parse(dbTitle) as VolumeData
      return data.volume_name
    }
  } catch (e) {}
  return dbTitle
}

export function ChapterVolumeList({ storySlug, chapters, volumes, isAdmin }: ChapterVolumeListProps) {
  const router = useRouter()
  
  const [isPending, setIsPending] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedNums, setSelectedNums] = useState<number[]>([])

  const [isEditMode, setIsEditMode] = useState(false)
  const [editVol, setEditVol] = useState({
    startChapter: 1,
    volumeNumber: 1,
    volumeName: '',
    endChapter: '',
    description: ''
  })

  // 1. TÍNH NĂNG CHỌN TẤT CẢ / BỎ CHỌN TẤT CẢ
  const allSelected = chapters.length > 0 && selectedNums.length === chapters.length

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedNums([])
    } else {
      setSelectedNums(chapters.map(c => c.number))
    }
  }

  const toggleSelectChapter = (num: number) => {
    if (selectedNums.includes(num)) {
      setSelectedNums(selectedNums.filter(n => n !== num))
    } else {
      setSelectedNums([...selectedNums, num])
    }
  }

  // 2. CHIA NHÓM CHƯƠNG THEO QUYỂN (VOLUMES)
  const groupedChapters = useMemo(() => {
    const groups: { start_chapter: number; title: string; chapters: Chapter[] }[] = []
    let currentGroup = { start_chapter: 1, title: 'Danh sách chương', chapters: [] as Chapter[] }

    const sortedVolumes = [...volumes].sort((a, b) => a.start_chapter - b.start_chapter)

    if (sortedVolumes.length > 0 && sortedVolumes[0].start_chapter === 1) {
      currentGroup.title = getVolumeDisplayName(sortedVolumes[0].title)
    }

    chapters.forEach((ch) => {
      const matchingVol = sortedVolumes.find(v => v.start_chapter === ch.number)
      
      if (matchingVol && ch.number !== 1) {
        if (currentGroup.chapters.length > 0) groups.push(currentGroup)
        currentGroup = { 
          start_chapter: matchingVol.start_chapter, 
          title: getVolumeDisplayName(matchingVol.title),
          chapters: [] 
        }
      }
      
      currentGroup.chapters.push(ch)
    })
    
    if (currentGroup.chapters.length > 0) groups.push(currentGroup)
      
    return groups
  }, [chapters, volumes])

  const [openGroups, setOpenGroups] = useState<number[]>([groupedChapters[0]?.start_chapter || 1])

  const toggleGroup = (startChapter: number) => {
    if (openGroups.includes(startChapter)) {
      setOpenGroups(openGroups.filter(id => id !== startChapter))
    } else {
      setOpenGroups([...openGroups, startChapter])
    }
  }

  // 3. THAO TÁC QUẢN LÝ QUYỂN
  const handleCancelEdit = () => {
    setIsEditMode(false)
    setEditVol({
      startChapter: 1,
      volumeNumber: volumes.length + 1,
      volumeName: '',
      endChapter: '',
      description: ''
    })
  }

  const handleEditClick = (vol: Volume) => {
    setIsEditMode(true)
    const parsed = parseVolumeTitle(vol.title)
    setEditVol({
      startChapter: vol.start_chapter,
      volumeNumber: parsed.volume_number,
      volumeName: parsed.volume_name,
      endChapter: parsed.end_chapter ? String(parsed.end_chapter) : '',
      description: parsed.description || ''
    })
  }

  const handleSaveVolume = async () => {
    if (!editVol.volumeName.trim()) {
      alert("Vui lòng nhập tên quyển!")
      return
    }

    const parsedVols = volumes.map(v => ({ ...v, data: parseVolumeTitle(v.title) }))
    const isVolumeExists = parsedVols.some(v => 
      v.data.volume_number === Number(editVol.volumeNumber) && 
      (!isEditMode || v.start_chapter !== editVol.startChapter)
    )

    if (isVolumeExists) {
      const proceed = confirm("Quyển này đã tồn tại. Bạn muốn cập nhật hay tạo quyển khác?")
      if (!proceed) return
    }

    const serializedTitle = JSON.stringify({
      volume_number: Number(editVol.volumeNumber),
      volume_name: editVol.volumeName.trim(),
      description: editVol.description.trim() || undefined,
      end_chapter: editVol.endChapter ? Number(editVol.endChapter) : undefined
    })

    setIsPending(true)
    try {
      const res = await addOrUpdateVolume(storySlug, Number(editVol.startChapter), serializedTitle)
      if (res.success) {
        handleCancelEdit()
        router.refresh()
      } else alert("Lỗi: " + res.error)
    } finally { setIsPending(false) }
  }

  const handleDeleteVolume = async (vol: Volume) => {
    const displayName = getVolumeDisplayName(vol.title)
    const proceed = confirm(`Bạn có chắc chắn muốn xóa "${displayName}" không?\n(Chỉ xóa thanh chia quyển, các chương bên trong vẫn an toàn)`)
    if (!proceed) return

    setIsPending(true)
    try {
      const res = await deleteVolume(storySlug, vol.start_chapter)
      if (res.success) {
        if (isEditMode && editVol.startChapter === vol.start_chapter) handleCancelEdit()
        router.refresh()
      } else alert("Lỗi: " + res.error)
    } finally { setIsPending(false) }
  }

  // 4. THAO TÁC XÓA ĐƠN VÀ XÓA HÀNG LOẠT
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
        setSelectedNums(selectedNums.filter(n => n !== chapterNumber))
        router.refresh()
      } else alert("Lỗi khi xóa chương: " + res.error)
    } catch (err) {
      alert("Đã xảy ra sự cố khi xóa chương truyện!")
    } finally {
      setIsPending(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedNums.length === 0) return
    if (!confirm(`Bạn có chắc chắn muốn XÓA ${selectedNums.length} chương đã chọn không? Thao tác này không thể hoàn tác!`)) {
      return
    }

    setIsPending(true)
    try {
      const res = await bulkDeleteChapters(storySlug, selectedNums)
      if (res.success) {
        setSelectedNums([])
        router.refresh()
      } else {
        alert("Lỗi khi xóa hàng loạt: " + res.error)
      }
    } catch (err: any) {
      alert("Lỗi kết nối: " + err.message)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="w-full space-y-4 font-sans text-left relative">
      
      {/* NỀN ĐỒNG BỘ DỮ LIỆU */}
      {isPending && (
        <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-[2px] flex items-center justify-center">
          <div className="bg-white dark:bg-[#241D18] p-4 rounded-2xl shadow-2xl border border-[#F2E8DC] dark:border-white/10 flex items-center gap-3">
            <Loader2 className="size-5 animate-spin text-[#A45C12] dark:text-[#F4C27A]" />
            <span className="text-xs font-semibold text-[#5A3823] dark:text-[#E9D7C3]">Đang đồng bộ dữ liệu...</span>
          </div>
        </div>
      )}

      {/* BAR THÔNG TIN ADMIN & NÚT MỞ POPUP QUẢN LÝ QUYỂN */}
      {isAdmin && (
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-1 text-xs font-bold text-[#7A4A2D] dark:text-[#E9D7C3]">
          <div className="flex items-center gap-2">
            <span>{chapters.length} chương</span>
            {selectedNums.length > 0 && (
              <span className="text-[#A45C12] dark:text-[#F4C27A] font-semibold bg-[#FFF4E7] dark:bg-[#3D2D23] px-2.5 py-0.5 rounded-full border border-[#D89A52]/40 text-[11px]">
                Đã chọn {selectedNums.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {chapters.length > 0 && (
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs font-bold text-[#7A4A2D] dark:text-[#E9D7C3] hover:text-[#5A3823] transition-colors">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="size-4 rounded border-[#EEDFD0] dark:border-white/10 text-[#D89A52] focus:ring-[#D89A52] cursor-pointer accent-[#D89A52]"
                />
                <span>Chọn tất cả</span>
              </label>
            )}

            <Button 
              onClick={() => { setIsModalOpen(true); handleCancelEdit() }} 
              variant="outline" 
              className="border-[#EEDFD0] dark:border-white/10 text-[#7A4A2D] dark:text-[#E9D7C3] bg-white dark:bg-[#241D18] hover:bg-[#FFF4E7] dark:hover:bg-[#3D2D23] gap-1.5 h-8 px-3 text-xs font-semibold rounded-xl shadow-2xs transition-all"
            >
              <Plus className="size-3.5 text-[#A45C12] dark:text-[#F4C27A]" /> Quản lý thanh chia quyển
            </Button>
          </div>
        </div>
      )}

      {/* THANH THAO TÁC STICKY KHI CHỌN CHƯƠNG */}
      {isAdmin && selectedNums.length > 0 && (
        <div className="sticky top-20 z-40 flex flex-wrap items-center justify-between gap-3 px-5 py-3 rounded-[18px] border border-[#D89A52]/50 bg-white/95 dark:bg-[#241D18]/95 backdrop-blur-md shadow-md animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-[#5A3823] dark:text-[#E9D7C3]">
            <span className="flex items-center justify-center h-6 px-2.5 rounded-full bg-[#FFF4E7] dark:bg-[#3D2D23] border border-[#D89A52] text-[#A45C12] dark:text-[#F4C27A] text-xs font-extrabold">
              Đã chọn {selectedNums.length} chương
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleSelectAll}
              className="h-8 px-3 rounded-xl border-[#EEDFD0] dark:border-white/10 text-xs font-semibold text-[#7A4A2D] dark:text-[#E9D7C3] hover:bg-[#FFF4E7] dark:hover:bg-[#3D2D23]"
            >
              {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedNums([])}
              className="h-8 px-3 rounded-xl text-xs font-semibold text-[#9B8C80] hover:text-[#5A3823] dark:text-stone-400 dark:hover:text-[#E9D7C3]"
            >
              Bỏ chọn
            </Button>
            <Button
              type="button"
              onClick={handleBulkDelete}
              disabled={isPending}
              size="sm"
              className="h-8 px-3.5 rounded-xl text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              {isPending ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
              Xóa
            </Button>
          </div>
        </div>
      )}

      {/* KHUNG CARD NGOÀI QUYỂN */}
      {groupedChapters.map((group) => {
        const isOpen = openGroups.includes(group.start_chapter)

        return (
          <div 
            key={group.start_chapter} 
            className="rounded-[20px] border border-[#F2E8DC] dark:border-white/10 bg-white dark:bg-[#241D18] p-4 sm:p-5 shadow-[0_4px_20px_rgba(80,50,20,0.04)] transition-all duration-200"
          >
            {/* HEADER QUYỂN */}
            <div 
              onClick={() => toggleGroup(group.start_chapter)}
              className="flex items-center justify-between cursor-pointer select-none group"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex p-2 rounded-xl bg-[#FFF4E7] dark:bg-[#3D2D23] text-[#A45C12] dark:text-[#F4C27A] shrink-0 items-center justify-center group-hover:scale-105 transition-transform duration-200">
                  <BookOpen className="size-4.5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-[#5A3823] dark:text-[#E9D7C3] text-base sm:text-lg leading-tight">
                    {group.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-[#9B8C80] dark:text-[#B59C86]">
                  {group.chapters.length} chương
                </span>
                <div className="flex size-7.5 items-center justify-center rounded-full bg-[#FFF4E7]/60 dark:bg-[#3D2D23]/60 text-[#5A3823] dark:text-[#E9D7C3] hover:bg-[#FFF4E7] dark:hover:bg-[#3D2D23] transition-colors">
                  {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </div>
              </div>
            </div>

            {/* 🌟 LƯỚI CARD CHƯƠNG ĐÃ ĐƯỢC CĂN LỀ TRÁI CÂN ĐỐI THẲNG HÀNG 100% [MỚI] */}
            {isOpen && (
              <>
                <div className="my-3.5 border-t border-[#F6EBDD] dark:border-white/10" />

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 animate-in fade-in duration-200">
                  {group.chapters.map((ch) => {
                    const isSelected = selectedNums.includes(ch.number)

                    return (
                      <div 
                        key={ch.number} 
                        onClick={() => isAdmin && toggleSelectChapter(ch.number)}
                        className={cn(
                          // 🌟 justify-start & text-left giúp tất cả tên chương bắt đầu ở mép trái thẳng hàng đứng
                          "group relative flex h-[42px] items-center justify-start px-3.5 rounded-xl border text-left transition-all duration-200 ease-out select-none cursor-pointer overflow-hidden",
                          isSelected
                            ? "bg-gradient-to-r from-[#F4C27A] to-[#D89A52] border-[#D89A52] text-white shadow-[0_4px_12px_rgba(216,154,82,0.3)] scale-[1.01]"
                            : "bg-white dark:bg-[#31261F] border-[#EEDFD0] dark:border-white/10 text-[#7A4A2D] dark:text-[#E9D7C3] hover:border-[#D89A52] dark:hover:border-[#D89A52] hover:bg-[#FFF8F1] dark:hover:bg-[#3D2D23] hover:-translate-y-[1px] hover:shadow-xs"
                        )}
                      >
                        {/* CHECKBOX ADMIN */}
                        {isAdmin && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation()
                              toggleSelectChapter(ch.number)
                            }}
                            className="size-3.5 rounded border-stone-300 dark:border-stone-700 text-[#D89A52] focus:ring-[#D89A52] cursor-pointer shrink-0 mr-2 accent-[#D89A52]"
                          />
                        )}

                        {/* 🌟 text-left giúp chữ CHƯƠNG... bắt đầu thẳng hàng tăm tắp từ bên trái qua */}
                        <Link
                          href={`/truyen/${storySlug}/${ch.number}`}
                          onClick={(e) => isAdmin && e.stopPropagation()}
                          className={cn(
                            "text-[12px] font-bold uppercase tracking-tight truncate flex-1 text-left transition-colors min-w-0",
                            isSelected
                              ? "text-white"
                              : "text-[#7A4A2D] dark:text-[#E9D7C3] group-hover:text-[#5A3823] dark:group-hover:text-[#F4C27A]"
                          )}
                        >
                          {ch.title}
                        </Link>

                        {/* NÚT XÓA ĐƠN HOVER */}
                        {isAdmin && (
                          <button
                            onClick={(e) => {
                              e.preventDefault() 
                              e.stopPropagation() 
                              handleDeleteChapterClick(ch.number, ch.title)
                            }}
                            className="p-0.5 text-[#9B8C80] hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors opacity-0 group-hover:opacity-100 ml-1 shrink-0"
                            title={`Xóa vĩnh viễn ${ch.title}`}
                          >
                            <Trash2 className="size-3" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )
      })}

      {/* POPUP MODAL QUẢN LÝ QUYỂN */}
      {isAdmin && isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-[28px] bg-white dark:bg-[#241D18] p-6 sm:p-7 shadow-2xl border border-[#F2E8DC] dark:border-white/10 transform transition-all max-h-[88vh] overflow-y-auto">
            
            <div className="flex justify-between items-center mb-4 border-b border-[#F6EBDD] dark:border-white/10 pb-3">
              <h3 className="text-lg font-serif font-bold text-[#5A3823] dark:text-[#E9D7C3] flex items-center gap-2">
                {isEditMode ? <Edit2 className="size-5 text-[#A45C12] animate-pulse" /> : <Plus className="size-5 text-[#A45C12]" />}
                {isEditMode ? 'Chỉnh sửa Quyển' : 'Tạo thanh Quyển mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#9B8C80] hover:text-[#5A3823] dark:hover:text-[#E9D7C3] transition">
                <XCircle className="size-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-[#FFF9F4] dark:bg-[#31261F] p-4 rounded-2xl border border-[#EEDFD0] dark:border-white/10 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-left">
                    <label className="text-[10px] font-bold text-[#9B8C80] uppercase tracking-wide">Số quyển:</label>
                    <Input 
                      type="number" 
                      min={1}
                      value={editVol.volumeNumber} 
                      onChange={(e) => setEditVol({...editVol, volumeNumber: parseInt(e.target.value) || 1})} 
                      className="mt-1 border-[#EEDFD0] dark:border-white/10 font-semibold bg-white dark:bg-[#241D18] text-[#5A3823] dark:text-[#E9D7C3] h-9 rounded-xl"
                    />
                  </div>
                  <div className="text-left">
                    <label className="text-[10px] font-bold text-[#9B8C80] uppercase tracking-wide">Chương bắt đầu:</label>
                    <Input 
                      type="number" 
                      min={1}
                      value={editVol.startChapter} 
                      onChange={(e) => setEditVol({...editVol, startChapter: parseInt(e.target.value) || 1})} 
                      disabled={isEditMode}
                      className="mt-1 border-[#EEDFD0] dark:border-white/10 font-semibold bg-white dark:bg-[#241D18] text-[#5A3823] dark:text-[#E9D7C3] h-9 rounded-xl disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="text-left">
                    <label className="text-[10px] font-bold text-[#9B8C80] uppercase tracking-wide">Tên quyển:</label>
                    <Input 
                      value={editVol.volumeName} 
                      onChange={(e) => setEditVol({...editVol, volumeName: e.target.value})} 
                      placeholder="Nhập tên quyển..."
                      className="mt-1 border-[#EEDFD0] dark:border-white/10 font-semibold bg-white dark:bg-[#241D18] text-[#5A3823] dark:text-[#E9D7C3] h-9 rounded-xl"
                    />
                  </div>
                  <div className="text-left">
                    <label className="text-[10px] font-bold text-[#9B8C80] uppercase tracking-wide">Chương kết thúc (nếu có):</label>
                    <Input 
                      type="number" 
                      value={editVol.endChapter} 
                      onChange={(e) => setEditVol({...editVol, endChapter: e.target.value})} 
                      placeholder="Ví dụ: 192"
                      className="mt-1 border-[#EEDFD0] dark:border-white/10 font-semibold bg-white dark:bg-[#241D18] text-[#5A3823] dark:text-[#E9D7C3] h-9 rounded-xl"
                    />
                  </div>
                </div>

                <div className="text-left">
                  <label className="text-[10px] font-bold text-[#9B8C80] uppercase tracking-wide">Mô tả quyển (nếu có):</label>
                  <Textarea 
                    value={editVol.description} 
                    onChange={(e) => setEditVol({...editVol, description: e.target.value})} 
                    placeholder="Nhập mô tả ngắn cho quyển này..."
                    className="mt-1 border-[#EEDFD0] dark:border-white/10 font-semibold bg-white dark:bg-[#241D18] text-[#5A3823] dark:text-[#E9D7C3] min-h-[50px] text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1 border-t border-[#F6EBDD] dark:border-white/10">
                {isEditMode ? (
                  <Button variant="outline" onClick={handleCancelEdit} disabled={isPending} className="rounded-xl h-9 text-xs font-semibold text-[#9B8C80]">
                    Hủy chỉnh sửa
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isPending} className="rounded-xl h-9 text-xs font-semibold text-[#9B8C80]">
                    Hủy
                  </Button>
                )}

                <Button onClick={handleSaveVolume} disabled={isPending} className="bg-[#A45C12] hover:bg-[#8A490F] text-white rounded-xl h-9 text-xs font-semibold transition-all">
                  {isPending && <Loader2 className="size-4 animate-spin mr-1.5" />} 
                  {isEditMode ? 'Cập nhật' : 'Lưu quyển'}
                </Button>
              </div>

              {/* DANH SÁCH CÁC QUYỂN HIỆN TẠI */}
              {volumes.length > 0 && (
                <div className="pt-4 border-t border-[#F6EBDD] dark:border-white/10">
                  <span className="text-[10px] font-bold text-[#9B8C80] uppercase tracking-wider mb-2 block text-left">Các quyển hiện tại:</span>
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {[...volumes]
                      .map(v => ({ ...v, parsed: parseVolumeTitle(v.title) }))
                      .sort((a, b) => a.parsed.volume_number - b.parsed.volume_number || a.start_chapter - b.start_chapter)
                      .map((v, index, sortedArr) => {
                      
                        const nextVol = sortedArr[index + 1]
                        const autoEndChapter = nextVol ? nextVol.start_chapter - 1 : (chapters.length > 0 ? chapters[chapters.length - 1].number : '...')
                        const finalEndChapter = v.parsed.end_chapter || autoEndChapter
                        const isActive = isEditMode && editVol.startChapter === v.start_chapter

                        return (
                          <div 
                            key={v.start_chapter} 
                            onClick={() => handleEditClick(v)}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all duration-200 group relative overflow-hidden text-left",
                              isActive 
                                ? "bg-[#FFF4E7] dark:bg-[#3D2D23] border-[#D89A52]" 
                                : "bg-[#FFF9F4] dark:bg-[#31261F] border-[#EEDFD0] dark:border-white/10 hover:border-[#D89A52]"
                            )}
                            title="Bấm vào để chỉnh sửa quyển này"
                          >
                            <div className="flex items-start gap-3">
                              <span className={cn("text-base mt-0.5", isActive ? "text-[#A45C12]" : "text-[#9B8C80] group-hover:text-[#A45C12]")}>📖</span>
                              <div>
                                <p className={cn("text-xs font-bold", isActive ? "text-[#5A3823] dark:text-[#E9D7C3]" : "text-[#7A4A2D] dark:text-[#E9D7C3]")}>
                                  {getVolumeDisplayName(v.title)}
                                </p>
                                <p className="text-[11px] font-semibold text-[#9B8C80] dark:text-stone-400 mt-0.5">
                                  Chương {v.start_chapter} → {finalEndChapter}
                                </p>
                                {v.parsed.description && (
                                  <p className="text-[10px] text-[#9B8C80] italic line-clamp-1 mt-0.5 max-w-[200px]">
                                    {v.parsed.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleEditClick(v) }}
                                className="p-1.5 text-[#A45C12] bg-[#FFF4E7] dark:bg-[#3D2D23] hover:bg-[#FFE8D1] rounded-lg transition"
                                title="Chỉnh sửa"
                              >
                                <Edit2 className="size-3.5" />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteVolume(v) }} 
                                className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/40 rounded-lg transition"
                                title="Xóa quyển"
                              >
                                <Trash2 className="size-3.5"/>
                              </button>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  )
}