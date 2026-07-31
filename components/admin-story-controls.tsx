'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Edit, Eye, EyeOff, Trash2, Upload, Loader2, X, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Story } from '@/lib/stories'
import { togglePublishStory, deleteStory, updateFullStoryInfo, uploadImage } from '@/app/actions/admin'

export function AdminStoryControls({ story }: { story: Story }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // State chỉnh sửa
  const [title, setTitle] = useState(story.title)
  const [author, setAuthor] = useState(story.author)
  const [cover, setCover] = useState(story.cover)
  const [description, setDescription] = useState(story.description)
  const [link, setLink] = useState(story.link || '')
  const [genres, setGenres] = useState((story.genres || []).join(', '))
  
  // 🌟 STATE MẬT KHẨU BẢO VỆ
  const [password, setPassword] = useState((story as any).password || '')

  const isPublic = (story as any).is_public !== false

  // Toggle Ẩn / Hiện
  const handleTogglePublish = async () => {
    if (!confirm(isPublic ? 'Bạn có chắc chắn muốn TẠM ẨN truyện này khỏi độc giả không?' : 'Bạn có chắc chắn muốn CÔNG KHAI lại truyện này?')) return
    setIsPending(true)
    try {
      const res = await togglePublishStory(story.slug, isPublic)
      if (res.success) router.refresh()
      else alert('Lỗi: ' + res.error)
    } finally {
      setIsPending(false)
    }
  }

  // Xóa truyện
  const handleDeleteStory = async () => {
    if (!confirm(`CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN truyện "${story.title}" cùng toàn bộ chương truyện không?`)) return
    setIsPending(true)
    try {
      const res = await deleteStory(story.slug)
      if (res.success) {
        alert('Đã xóa truyện thành công!')
        router.push('/')
      } else alert('Lỗi xóa truyện: ' + res.error)
    } finally {
      setIsPending(false)
    }
  }

  // Upload ảnh bìa mới
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    const res = await uploadImage(formData)
    if (res.success && res.url) setCover(res.url)
    else alert('Lỗi upload ảnh: ' + res.error)
    setIsUploading(false)
  }

  // Lưu thông tin đầy đủ
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)
    try {
      const res = await updateFullStoryInfo(story.slug, {
        title: title.trim(),
        author: author.trim(),
        cover: cover.trim(),
        description: description.trim(),
        link: link.trim(),
        genres: genres.trim(),
        password: password.trim() // 🌟 Gửi mật khẩu lên Server Action
      })
      if (res.success) {
        setIsModalOpen(false)
        router.refresh()
      } else alert('Lỗi cập nhật: ' + res.error)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="mt-8 p-4 rounded-2xl bg-amber-50/40 dark:bg-stone-900/60 border border-amber-200/60 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 text-left font-sans">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-400">Công cụ Admin:</span>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300">
          {isPublic ? '🟢 Đang công khai' : '🔴 Đã ẩn'}
        </span>
        {(story as any).password && (story as any).password.trim() !== '' && (
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
            <Lock className="size-3" /> Có mật khẩu
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="h-8 px-3 rounded-xl border-amber-300 text-amber-900 dark:text-amber-400 hover:bg-amber-100 text-xs font-bold gap-1.5"
        >
          <Edit className="size-3.5" /> Sửa thông tin
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleTogglePublish}
          disabled={isPending}
          className="h-8 px-3 rounded-xl border-stone-300 dark:border-stone-700 text-xs font-semibold gap-1.5"
        >
          {isPublic ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          {isPublic ? 'Tạm ẩn truyện' : 'Công khai truyện'}
        </Button>

        <Button
          type="button"
          size="sm"
          onClick={handleDeleteStory}
          disabled={isPending}
          className="h-8 px-3 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold gap-1.5"
        >
          <Trash2 className="size-3.5" /> Xóa truyện
        </Button>
      </div>

      {/* MODAL SỬA THÔNG TIN TRUYỆN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => !isPending && setIsModalOpen(false)} />

          <div className="relative w-full max-w-lg p-6 sm:p-7 rounded-[28px] border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xl z-10 space-y-4 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
              <h3 className="font-serif font-bold text-lg text-stone-800 dark:text-stone-100">Chỉnh sửa thông tin truyện</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-600 rounded-full p-1">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInfo} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300">Tên truyện:</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required className="h-9 rounded-xl text-xs bg-stone-50 dark:bg-stone-950" />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300">Tác giả:</label>
                <Input value={author} onChange={(e) => setAuthor(e.target.value)} required className="h-9 rounded-xl text-xs bg-stone-50 dark:bg-stone-950" />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300">Ảnh bìa:</label>
                <div className="flex gap-2">
                  <Input value={cover} onChange={(e) => setCover(e.target.value)} className="h-9 rounded-xl text-xs bg-stone-50 dark:bg-stone-950 flex-1" />
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="h-9 text-xs rounded-xl">
                    {isUploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5 mr-1" />} Tải ảnh
                  </Button>
                </div>
              </div>

              {/* 🌟 Ô NHẬP MẬT KHẨU BẢO VỆ TRUYỆN */}
              <div className="space-y-1 p-3 rounded-xl bg-amber-50/60 dark:bg-stone-850/60 border border-amber-200/60 dark:border-stone-800">
                <label className="font-bold text-amber-900 dark:text-amber-400 flex items-center gap-1.5">
                  <Lock className="size-3.5" /> Mật khẩu bảo vệ truyện (Để trống nếu công khai):
                </label>
                <Input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ví dụ: leoklein (để trống nếu không đặt pass)"
                  className="h-9 rounded-xl text-xs font-semibold bg-white dark:bg-stone-900 border-amber-200 dark:border-stone-800"
                />
                <p className="text-[10px] text-stone-400 italic">
                  * Độc giả khi vào truyện này sẽ phải gõ đúng mật khẩu mới xem được nội dung.
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300">Thể loại (Tag - cách nhau bằng dấu phẩy):</label>
                <Input value={genres} onChange={(e) => setGenres(e.target.value)} className="h-9 rounded-xl text-xs bg-stone-50 dark:bg-stone-950" />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300">Link bản gốc (Nếu có):</label>
                <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." className="h-9 rounded-xl text-xs bg-stone-50 dark:bg-stone-950" />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700 dark:text-stone-300">Tóm tắt / Giới thiệu:</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[90px] rounded-xl text-xs bg-stone-50 dark:bg-stone-950 p-2.5" />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isPending} className="h-9 text-xs rounded-xl">
                  Hủy
                </Button>
                <Button type="submit" disabled={isPending} className="h-9 px-5 text-xs font-bold rounded-xl bg-amber-800 hover:bg-amber-700 text-white">
                  {isPending ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null} Lưu thông tin
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}