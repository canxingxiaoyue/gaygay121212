'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Edit, Save, X, Loader2, Link as LinkIcon, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { updateStoryMetadata } from '@/app/actions/admin'

export function EditableDescription({
  storySlug,
  initialDescription,
  initialLink,
  initialGenres, // <-- Nhận mảng thể loại hiện tại của truyện
}: {
  storySlug: string
  initialDescription: string
  initialLink?: string
  initialGenres: string[]
}) {
  const { user, isSignedIn } = useUser()
  const router = useRouter()
  
  const isAdmin = isSignedIn && user?.id === process.env.NEXT_PUBLIC_ADMIN_ID

  const [isEditing, setIsEditing] = useState(false)
  const [description, setDescription] = useState(initialDescription)
  const [link, setLink] = useState(initialLink || '')
  // Chuyển mảng thể loại [A, B] thành chuỗi "A, B" để sửa đổi dễ dàng
  const [genres, setGenres] = useState(initialGenres.join(', ')) 
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    setIsSaving(true)
    // Gửi lưu cả 3 thông tin lên server
    const res = await updateStoryMetadata(storySlug, description, link, genres)
    if (res.success) {
      setIsEditing(false)
      router.refresh()
    } else {
      alert("Lỗi khi lưu thông tin truyện: " + res.error)
    }
    setIsSaving(false)
  }

  if (isEditing) {
    return (
      <div className="space-y-4 rounded-xl border border-amber-800/20 bg-amber-50/10 p-4">
        {/* Sửa Giới thiệu */}
        <div>
          <label className="text-xs font-semibold text-stone-500">Giới thiệu truyện:</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[150px] mt-1 text-sm leading-relaxed"
            disabled={isSaving}
          />
        </div>

        {/* Sửa Thể loại (Tags) */}
        <div>
          <label className="text-xs font-semibold text-stone-500">Thể loại / Tags (Ngăn cách nhau bằng dấu phẩy):</label>
          <div className="flex gap-2 items-center mt-1">
            <Hash className="size-4 text-stone-400 shrink-0" />
            <Input
              value={genres}
              onChange={(e) => setGenres(e.target.value)}
              placeholder="Ví dụ: Huyền huyễn, Nam chủ, Dị thế đại lục..."
              className="h-9 text-sm"
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Sửa Link */}
        <div>
          <label className="text-xs font-semibold text-stone-500">Link bản gốc:</label>
          <div className="flex gap-2 items-center mt-1">
            <LinkIcon className="size-4 text-stone-400 shrink-0" />
            <Input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              className="h-9 text-sm"
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>
            <X className="size-4 mr-1.5" /> Hủy
          </Button>
          <Button size="sm" onClick={handleSave} className="bg-amber-700 hover:bg-amber-800 text-white" disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="size-4 animate-spin mr-1.5" />
            ) : (
              <Save className="size-4 mr-1.5" />
            )}
            Lưu thay đổi
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 group relative">
      <p className="whitespace-pre-line text-pretty leading-relaxed text-stone-700 dark:text-stone-300">
        {description}
      </p>

      {link && (
        <p className="text-sm">
          <span className="text-stone-500 dark:text-stone-400">Link bản gốc: </span>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-800 dark:text-amber-400 font-bold hover:underline"
          >
            Link
          </a>
        </p>
      )}

      {isAdmin && (
        <Button
          onClick={() => {
            setGenres(initialGenres.join(', '))
            setIsEditing(true)
          }}
          variant="outline"
          size="sm"
          className="mt-2 text-amber-800 dark:text-amber-400 gap-1.5 border-amber-800/30 dark:border-amber-400/30 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Edit className="size-4" /> Sửa giới thiệu & Link
        </Button>
      )}
    </div>
  )
}