'use client'

import { useState, useEffect } from 'react'
import { useUser, SignInButton } from '@clerk/nextjs'
import { isFavorited, toggleFavorite } from '@/app/actions/favorites'
import { Button } from '@/components/ui/button'
import { Heart, Loader2 } from 'lucide-react'

// Cấu hình để chấp nhận cả 3 tên biến có thể xảy ra từ trang chủ hoặc trang chi tiết!
export function FavoriteButton({ 
  storySlug, 
  slug, 
  storyId 
}: { 
  storySlug?: string; 
  slug?: string; 
  storyId?: string 
}) {
  const { user, isSignedIn } = useUser()
  
  // TỰ ĐỘNG NHẬN DIỆN BIẾN CHUẨN ĐỂ GỬI LÊN DATABASE
  const activeSlug = storySlug || slug || storyId 

  const [favorited, setFavorited] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  // 1. Kiểm tra trạng thái yêu thích từ Vercel Postgres khi mở trang
  useEffect(() => {
    async function checkStatus() {
      if (isSignedIn && user?.id && activeSlug) {
        const status = await isFavorited(user.id, activeSlug)
        setFavorited(status)
      }
      setIsChecking(false)
    }
    checkStatus()
  }, [isSignedIn, user?.id, activeSlug])

  // 2. Xử lý khi bấm nút Yêu thích
  async function handleToggle() {
    if (!isSignedIn || !user?.id || !activeSlug) return
    setLoading(true)
    const res = await toggleFavorite(user.id, activeSlug)
    if (res.success) {
      setFavorited(res.isFavorited || false)
    } else {
      alert("Lỗi lưu yêu thích: " + res.error)
    }
    setLoading(false)
  }

  if (!activeSlug) return null

  if (isChecking) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-1.5 rounded-full h-8 px-3">
        <Loader2 className="size-3 animate-spin" />
        <span className="text-xs">Loading...</span>
      </Button>
    )
  }

  // TRẠNG THÁI: CHƯA ĐĂNG NHẬP (Bắt đăng nhập)
  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
      </SignInButton>
    )
  }

  // TRẠNG THÁI: ĐÃ ĐĂNG NHẬP (Khi thích sẽ đổi màu đỏ rực rỡ)
  return (
    <Button
      variant={favorited ? "default" : "outline"}
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className={`gap-1.5 rounded-full transition-all h-8 px-3 ${
        favorited 
          ? "bg-red-500 hover:bg-red-600 text-white border-red-500 shadow-sm" 
          : "border-stone-200 hover:bg-stone-100"
      }`}
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Heart className={`size-3.5 ${favorited ? "fill-white text-white" : "text-stone-500"}`} />
      )}
      <span className="text-xs font-medium">{favorited ? "Đã thích" : "Yêu thích"}</span>
    </Button>
  )
}