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
  storyId,
  variant = 'default' // 🌟 Mặc định là nút chữ to ở trang chi tiết, truyền 'icon' để làm nút tròn mờ ở bìa truyện
}: { 
  storySlug?: string; 
  slug?: string; 
  storyId?: string;
  variant?: 'default' | 'icon'
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

  // ==============================================================
  // 🌟 TRẠNG THÁI 1: NÚT TRÒN MỜ ẢO TRÊN BÌA TRUYỆN (variant="icon")
  // ==============================================================
  if (variant === 'icon') {
    if (isChecking) {
      return (
        <Button variant="outline" size="icon" disabled className="w-8 h-8 rounded-full bg-black/20 border-white/10 shrink-0">
          <Loader2 className="size-3.5 animate-spin text-white" />
        </Button>
      )
    }

    if (!isSignedIn) {
      return (
        <SignInButton mode="modal">
          <Button
            variant="outline"
            size="icon"
            className="w-8 h-8 rounded-full transition-all duration-200 border border-white/15 bg-black/35 backdrop-blur-md text-white hover:bg-rose-500 hover:border-rose-500 hover:text-white group active:scale-90 shrink-0 shadow-md"
          >
            <Heart className="size-4 fill-none transition-transform duration-300 group-hover:scale-110" />
          </Button>
        </SignInButton>
      )
    }

    return (
      <Button
        size="icon"
        onClick={handleToggle}
        disabled={loading}
        className={`w-8 h-8 rounded-full transition-all duration-200 border shrink-0 active:scale-90 group shadow-md ${
          favorited 
            ? "bg-rose-500 border-rose-500 text-white shadow-rose-950/20" 
            : "border-white/15 bg-black/35 backdrop-blur-md text-white hover:bg-rose-500 hover:border-rose-500 hover:text-white"
        }`}
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Heart 
            className={`size-4 transition-transform duration-300 ${
              favorited 
                ? "fill-white text-white scale-105 group-hover:scale-120 animate-pulse" 
                : "fill-none text-white group-hover:scale-110"
            }`} 
          />
        )}
      </Button>
    )
  }

  // ==============================================================
  // 🌟 TRẠNG THÁI 2: NÚT CHỮ TO ĐỒNG BỘ Ở TRANG CHI TIẾT (variant="default")
  // ==============================================================
  if (isChecking) {
    return (
      <Button variant="outline" size="lg" disabled className="gap-2 rounded-full px-5 shrink-0">
        <Loader2 className="size-4 animate-spin text-rose-500" />
        <span className="text-sm font-semibold">Đang tải...</span>
      </Button>
    )
  }

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <Button
          variant="outline"
          size="lg"
          className="gap-2 rounded-full transition-all duration-200 px-5 border-rose-200/50 hover:bg-rose-50/60 text-rose-600 dark:border-rose-900/30 dark:hover:bg-rose-950/20 dark:text-rose-400 group active:scale-95 shrink-0"
        >
          <Heart className="size-4 text-rose-500 fill-none transition-transform duration-300 group-hover:scale-110" />
          <span className="text-sm font-semibold">Yêu thích</span>
        </Button>
      </SignInButton>
    )
  }

  return (
    <Button
      size="lg"
      onClick={handleToggle}
      disabled={loading}
      className={`gap-2 rounded-full transition-all duration-200 px-5 border shrink-0 active:scale-95 group ${
        favorited 
          ? "bg-rose-500 hover:bg-rose-600 border-rose-500 text-white font-semibold shadow-sm shadow-rose-200/30" 
          : "bg-rose-50/60 hover:bg-rose-100/80 dark:bg-rose-950/10 dark:hover:bg-rose-950/20 border-rose-200/50 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 font-semibold"
      }`}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Heart 
          className={`size-4 transition-transform duration-300 ${
            favorited 
              ? "fill-rose-100 text-rose-100 scale-105 group-hover:scale-120 animate-pulse" 
              : "text-rose-500 fill-none group-hover:scale-110"
          }`} 
        />
      )}
      <span className="text-sm font-semibold">
        {loading ? "Đang xử lý..." : favorited ? "Đã thích" : "Yêu thích"}
      </span>
    </Button>
  )
}