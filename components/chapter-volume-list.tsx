'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, Trash2, Plus, Loader2, BookOpen, Edit2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { addOrUpdateVolume, deleteVolume, deleteChapter } from '@/app/actions/admin'
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
      volume_name: dbTitle // Giữ nguyên dbTitle gốc để không bị mất chữ "Quyển" của dữ liệu cũ
    }
  }
  return {
    volume_number: 1,
    volume_name: dbTitle
  }
}

// 🌟 ĐÃ SỬA: Hàm hiển thị trả về đúng tên bạn nhập, xóa bỏ hoàn toàn chữ tự động Quyển 1, Quyển 2 [1]
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

  const [isEditMode, setIsEditMode] = useState(false)
  const [editVol, setEditVol] = useState({
    startChapter: 1,
    volumeNumber: 1,
    volumeName: '',
    endChapter: '',
    description: ''
  })

  // Thuật toán chia nhóm chương dựa trên mốc Quyển (Volumes)
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
          title: getVolumeDisplayName(matchingVol.title), // Hiện tên đã bóc tách động [1]
          chapters: [] 
        }
      }
      
      currentGroup.chapters.push(ch)
    })
    
    if (currentGroup.chapters.length > 0) groups.push(currentGroup)
      
    return groups
  }, [chapters, volumes])

  const [openGroups, setOpenGroups] = useState<number[]>([groupedChapters[0]?.start_chapter])

  const toggleGroup = (startChapter: number) => {
    if (openGroups.includes(startChapter)) {
      setOpenGroups(openGroups.filter(id => id !== startChapter))
    } else {
      setOpenGroups([...openGroups, startChapter])
    }
  }

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
      } else alert("Lỗi khi xóa chương: " + res.error)
    } catch (err) {
      alert("Đã xảy ra sự cố khi xóa chương truyện!")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="w-full space-y-4 relative">
      
      {isPending && (
        <div className="fixed inset-0 z-[100] bg-black/15 backdrop-blur-[1px] flex items-center justify-center">
          <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-850 flex items-center gap-3">
            <Loader2 className="size-5 animate-spin text-amber-800" />
            <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">Đang đồng bộ dữ liệu truyện...</span>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="flex justify-end mb-2">
          <Button 
            onClick={() => { setIsModalOpen(true); handleCancelEdit() }} 
            variant="outline" 
            className="border-[#E5D8C8] text-[#8B5E3C] bg-[#F4EEE6]/40 hover:bg-[#F4EEE6] hover:text-[#5C3D2E] gap-1.5 h-8 text-xs rounded-xl"
          >
            <Plus className="size-4" /> Quản lý thanh chia quyển
          </Button>
        </div>
      )}

      {groupedChapters.map((group) => {
        const isOpen = openGroups.includes(group.start_chapter)

        return (
          <div key={group.start_chapter} className="border border-[#E5D8C8]/60 dark:border-stone-800/60 rounded-2xl bg-[#FFFDFB] dark:bg-[#1a1412] shadow-sm overflow-hidden transition-all duration-300">
            
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

            {isOpen && (
              <div className="p-5 border-t border-[#E5D8C8]/40 dark:border-stone-800/60 bg-[#FBF9F6]/40 dark:bg-transparent">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {group.chapters.map((ch) => (
                    <div key={ch.number} className="relative group w-full">
                      <Link
                        href={`/truyen/${storySlug}/${ch.number}`}
                        className={cn(
                          "flex items-center justify-center rounded-xl border border-[#E5D8C8]/60 dark:border-stone-800 bg-[#FFFDFB] dark:bg-stone-900 px-3 py-3 transition-all hover:border-[#8B5E3C] hover:text-[#8B5E3C] hover:bg-[#F4EEE6]/60 dark:hover:bg-stone-800/40 hover:shadow-sm w-full text-center overflow-hidden",
                          isAdmin && "pr-9 text-left" 
                        )}
                      >
                        <span className="text-[13px] font-bold uppercase tracking-wide text-[#5C3D2E]/80 dark:text-stone-300 line-clamp-1 truncate text-center w-full">
                          {ch.title}
                        </span>
                      </Link>

                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.preventDefault() 
                            e.stopPropagation() 
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

      {/* MODAL QUẢN LÝ QUYỂN */}
      {isAdmin && isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 p-6 shadow-2xl border border-stone-200 dark:border-stone-800 transform transition-all">
            
            <div className="flex justify-between items-center mb-4 border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                {isEditMode ? <Edit2 className="size-5 text-amber-600 animate-pulse" /> : <Plus className="size-5 text-amber-800" />}
                {isEditMode ? 'Chỉnh sửa Quyển' : 'Tạo thanh Quyển mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition">
                <XCircle className="size-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-stone-50 dark:bg-stone-950/50 p-4 rounded-2xl border border-stone-100 dark:border-stone-800 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Số quyển:</label>
                    <Input 
                      type="number" 
                      min={1}
                      value={editVol.volumeNumber} 
                      onChange={(e) => setEditVol({...editVol, volumeNumber: parseInt(e.target.value) || 1})} 
                      className="mt-1 border-stone-200 dark:border-stone-800 font-semibold bg-white dark:bg-stone-900 h-9"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Chương bắt đầu:</label>
                    <Input 
                      type="number" 
                      min={1}
                      value={editVol.startChapter} 
                      onChange={(e) => setEditVol({...editVol, startChapter: parseInt(e.target.value) || 1})} 
                      disabled={isEditMode}
                      className="mt-1 border-stone-200 dark:border-stone-800 font-semibold bg-white dark:bg-stone-900 h-9 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Tên quyển:</label>
                    <Input 
                      value={editVol.volumeName} 
                      onChange={(e) => setEditVol({...editVol, volumeName: e.target.value})} 
                      placeholder="Nhập tên quyển..."
                      className="mt-1 border-stone-200 dark:border-stone-800 font-semibold bg-white dark:bg-stone-900 h-9"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Chương kết thúc (nếu có):</label>
                    <Input 
                      type="number" 
                      value={editVol.endChapter} 
                      onChange={(e) => setEditVol({...editVol, endChapter: e.target.value})} 
                      placeholder="Tự động tính..."
                      className="mt-1 border-stone-200 dark:border-stone-800 font-semibold bg-white dark:bg-stone-900 h-9"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Mô tả quyển (nếu có):</label>
                  <Textarea 
                    value={editVol.description} 
                    onChange={(e) => setEditVol({...editVol, description: e.target.value})} 
                    placeholder="Nhập mô tả ngắn cho quyển này..."
                    className="mt-1 border-stone-200 dark:border-stone-800 font-semibold bg-white dark:bg-stone-900 min-h-[50px] text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1 border-t border-stone-100 dark:border-stone-800">
                {isEditMode ? (
                  <Button variant="outline" onClick={handleCancelEdit} disabled={isPending} className="rounded-xl h-9 text-xs font-semibold">
                    Hủy chỉnh sửa
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isPending} className="rounded-xl h-9 text-xs font-semibold">
                    Hủy
                  </Button>
                )}

                <Button onClick={handleSaveVolume} disabled={isPending} className="bg-[#8B5E3C] hover:bg-[#5C3D2E] text-white rounded-xl h-9 text-xs font-semibold transition-all">
                  {isPending && <Loader2 className="size-4 animate-spin mr-1.5" />} 
                  {isEditMode ? 'Cập nhật' : 'Lưu quyển'}
                </Button>
              </div>

              {/* DANH SÁCH CÁC QUYỂN HIỆN TẠI */}
              {volumes.length > 0 && (
                <div className="pt-4 border-t border-stone-100 dark:border-stone-800">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2 block">Các quyển hiện tại:</span>
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
                              "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200 group relative overflow-hidden",
                              isActive 
                                ? "bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900" 
                                : "bg-[#FBF9F6] dark:bg-stone-900 border-stone-200/60 dark:border-stone-800 hover:border-amber-300 dark:hover:border-stone-700"
                            )}
                            title="Bấm vào để chỉnh sửa quyển này"
                          >
                            <div className="flex items-start gap-3">
                              <span className={cn("text-base mt-0.5", isActive ? "text-amber-600" : "text-stone-400 group-hover:text-amber-600")}>📖</span>
                              <div>
                                {/* 🌟 ĐÃ SỬA: Hiển thị đúng getVolumeDisplayName động để xóa hẳn chữ tự động Quyển 1, Quyển 2 [1] */}
                                <p className={cn("text-sm font-bold", isActive ? "text-amber-900 dark:text-amber-100" : "text-stone-700 dark:text-stone-200")}>
                                  {getVolumeDisplayName(v.title)}
                                </p>
                                <p className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 mt-0.5">
                                  Chương {v.start_chapter} → {finalEndChapter}
                                </p>
                                {v.parsed.description && (
                                  <p className="text-[10px] text-stone-400 italic line-clamp-1 mt-0.5 max-w-[200px]">
                                    {v.parsed.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleEditClick(v) }}
                                className="p-1.5 text-amber-600 bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 rounded-md transition"
                                title="Chỉnh sửa"
                              >
                                <Edit2 className="size-3.5" />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteVolume(v) }} 
                                className="p-1.5 text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/40 rounded-md transition"
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