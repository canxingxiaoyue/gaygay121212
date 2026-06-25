'use client'

import { SignInButton, UserButton, useUser } from '@clerk/nextjs'
import { User as UserIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AccountMenu() {
  // isSignedIn: đã đăng nhập hay chưa
  // isLoaded: Clerk đã tải xong dữ liệu chưa
  const { isSignedIn, isLoaded } = useUser()

  // 1. Khi Clerk đang kiểm tra (đang load), hiện icon xoay nhẹ cho đẹp
  if (!isLoaded) {
    return (
      <Button variant="ghost" size="sm" disabled className="rounded-full">
        <Loader2 className="size-4 animate-spin" />
      </Button>
    )
  }

  // 2. Nếu ĐÃ ĐĂNG NHẬP: Hiện nút Avatar (UserButton)
if (isSignedIn) {
  return (
    <div className="flex items-center gap-2">
      <UserButton /> {/* <-- Chỉ để lại như này thôi, rất gọn! */}
    </div>
  )
}
  // 3. Nếu CHƯA ĐĂNG NHẬP: Hiện nút Đăng nhập
  return (
    <SignInButton mode="modal">
      <Button variant="outline" size="sm" className="gap-2 rounded-full border-stone-200 hover:bg-stone-100">
        <UserIcon className="size-4 text-stone-600" />
        <span className="hidden sm:inline text-stone-700 font-medium">Đăng nhập</span>
      </Button>
    </SignInButton>
  )
}