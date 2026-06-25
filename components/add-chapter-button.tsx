'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { addNewChapter } from '@/app/actions/admin' // Gọi Server Action tăng chương

export function AddChapterButton({
  storySlug,
  currentCount,
}: {
  storySlug: string
  currentCount: number
}) {
  const { user, isSignedIn } = useUser()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Kiểm tra quyền Admin
  const isAdmin = isSignedIn && user?.id === process.env.NEXT_PUBLIC_ADMIN_ID

  if (!isAdmin) return null

  // Xử lý thêm chương mới tinh
  async function handleAdd() {
    setIsLoading(true)
    const res = await addNewChapter(storySlug, currentCount)
    if (res.success && res.nextChapterNum) {
      router.refresh() // Làm mới trang cha để cập nhật danh sách chương
      // Tự động chuyển hướng Admin sang thẳng trang soạn thảo chương mới tinh đó!
      router.push(`/truyen/${storySlug}/${res.nextChapterNum}`)
    } else {
      alert("Lỗi khi thêm chương mới: " + res.error)
    }
    setIsLoading(false)
  }

  return (
    <Button
      onClick={handleAdd}
      disabled={isLoading}
      size="sm"
      className="bg-amber-800 hover:bg-amber-700 text-white rounded-xl text-xs gap-1.5 h-8 px-3 shadow-sm transition-all hover:scale-[1.02]"
    >
      {isLoading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Plus className="size-3.5" />
      )}
      Thêm chương mới
    </Button>
  )
}