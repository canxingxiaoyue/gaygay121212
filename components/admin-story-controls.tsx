'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Trash2, Loader2, Edit, X, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { togglePublishStory, deleteStory, updateFullStoryInfo, uploadImage } from '@/app/actions/admin'
import Image from 'next/image'

export function AdminStoryControls({ story }: { story: any }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isPending, setIsPending] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Lưu trữ dữ liệu đang sửa
  const [formData, setFormData] = useState({
    title: story.title || '',
    author: story.author || '',
    cover: story.cover || '',
    genres: Array.isArray(story.genres) ? story.genres.join(', ') : story.genres || '',
    link: story.link || '',
    description: story.description || ''
  })
  const [isUploading, setIsUploading] = useState(false)

  // Ẩn / Hiện truyện
  const handleTogglePublish = async () => {
    if (isPending) return
    setIsPending(true)
    try {
      const res = await togglePublishStory(story.slug, story.is_public !== false)
      if (res.success) {
        alert(res.isPublic ? "Đã đăng công khai truyện!" : "Đã tạm ẩn truyện thành công!")
        router.refresh()
      } else alert("Lỗi: " + res.error)
    } finally { setIsPending(false) }
  }

  // Xóa truyện
  const handleDelete = async () => {
    if (!confirm("CẢNH BÁO: XÓA VĨNH VIỄN truyện cùng toàn bộ dữ liệu? Hành động này không thể phục hồi!")) return
    setIsPending(true)
    try {
      const res = await deleteStory(story.slug)
      if (res.success) {
        alert("Đã xóa truyện thành công!")
        router.push('/')
      } else alert("Lỗi khi xóa: " + res.error)
    } finally { setIsPending(false) }
  }

  // Tải ảnh bìa
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const uploadData = new FormData()
      uploadData.append('file', file)
      const res = await uploadImage(uploadData)
      if (res.success) {
        setFormData({ ...formData, cover: res.url })
      } else alert("Lỗi tải ảnh: " + res.error)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // Lưu thông tin
  const handleSaveInfo = async () => {
    setIsPending(true)
    try {
      const res = await updateFullStoryInfo(story.slug, formData)
      if (res.success) {
        alert("Cập nhật thông tin truyện thành công!")
        setIsEditModalOpen(false)
        router.refresh()
      } else alert("Lỗi lưu thông tin: " + res.error)
    } finally { setIsPending(false) }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border border-amber-800/20 bg-amber-50/10 dark:bg-stone-900/10 p-3 rounded-xl my-4">
        <span className="text-xs font-bold text-amber-800 dark:text-amber-400 font-sans mr-2">CÔNG CỤ ADMIN:</span>
        
        <Button onClick={() => setIsEditModalOpen(true)} variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-amber-500 text-amber-700 hover:bg-amber-50 dark:text-amber-400">
          <Edit className="size-3.5" /> Sửa thông tin
        </Button>

        <Button onClick={handleTogglePublish} variant="outline" size="sm" disabled={isPending} className="h-8 text-xs gap-1.5">
          {isPending ? <Loader2 className="size-3.5 animate-spin" /> : story.is_public !== false ? <><EyeOff className="size-3.5" /> Tạm ẩn truyện</> : <><Eye className="size-3.5" /> Công khai truyện</>}
        </Button>

        <Button onClick={handleDelete} variant="destructive" size="sm" disabled={isPending} className="h-8 text-xs gap-1.5 bg-red-600 hover:bg-red-700">
          {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <><Trash2 className="size-3.5" /> Xóa truyện</>}
        </Button>
      </div>

      {/* BẢNG CHỈNH SỬA THÔNG TIN */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-sans backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-stone-950 p-6 shadow-2xl border border-stone-200 dark:border-stone-800">
            <div className="flex items-center justify-between border-b pb-4 mb-4 border-stone-100 dark:border-stone-800">
              <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100">Chỉnh sửa thông tin truyện</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-stone-400 hover:text-red-500 transition"><X className="size-6" /></button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-stone-500">Tên truyện</label>
                  <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="mt-1 font-bold border-stone-300" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-500">Tác giả</label>
                  <Input value={formData.author} onChange={(e) => setFormData({...formData, author: e.target.value})} className="mt-1 border-stone-300" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-500 block mb-1">Ảnh bìa</label>
                <div className="flex items-start gap-4">
                  <div className="relative w-20 h-28 rounded border border-stone-200 shadow-sm overflow-hidden shrink-0">
                    <Image src={formData.cover || '/placeholder.svg'} alt="Cover" fill className="object-cover" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input value={formData.cover} onChange={(e) => setFormData({...formData, cover: e.target.value})} placeholder="Dán link URL ảnh bìa hoặc tải lên..." className="text-xs border-stone-300" />
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm" className="h-8 text-xs w-fit" disabled={isUploading}>
                      {isUploading ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Upload className="size-3.5 mr-1.5" />} Tải ảnh từ máy tính
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-500 block">Thể loại (Tag) - Cách nhau bằng dấu phẩy</label>
                <Input value={formData.genres} onChange={(e) => setFormData({...formData, genres: e.target.value})} placeholder="Huyền huyễn, Nam chủ, Xuyên không..." className="mt-1 border-stone-300" />
              </div>
              
              <div>
                <label className="text-xs font-semibold text-stone-500 block">Link bản gốc (Nếu có)</label>
                <Input value={formData.link} onChange={(e) => setFormData({...formData, link: e.target.value})} placeholder="https://..." className="mt-1 border-stone-300" />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-500 block">Tóm tắt / Giới thiệu</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  rows={5}
                  className="mt-1 w-full rounded-md border border-stone-300 dark:border-stone-800 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-stone-100 dark:border-stone-800">
                <Button onClick={() => setIsEditModalOpen(false)} variant="ghost" disabled={isPending}>Hủy</Button>
                <Button onClick={handleSaveInfo} disabled={isPending} className="bg-amber-700 hover:bg-amber-800 text-white">
                  {isPending ? <Loader2 className="size-4 animate-spin mr-1.5" /> : null} Lưu thay đổi
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}