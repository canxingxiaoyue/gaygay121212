'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { KeyRound, Unlock, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function StoryPasswordGuard({
  password,
  storySlug,
  isAdmin,
  children,
}: {
  password?: string
  storySlug: string
  isAdmin: boolean
  children: React.ReactNode
}) {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [inputPass, setInputPass] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [hasCheckedSession, setHasCheckedSession] = useState(false)

  useEffect(() => {
    // 🌟 Admin được tự động mở khóa không cần gõ pass [1]
    if (!password || !password.trim() || isAdmin) {
      setIsUnlocked(true)
    } else {
      const savedPass = sessionStorage.getItem(`story_pass_${storySlug}`)
      if (savedPass === 'unlocked') {
        setIsUnlocked(true)
      }
    }
    setHasCheckedSession(true)
  }, [password, isAdmin, storySlug])

  if (!hasCheckedSession) return null

  if (isUnlocked) {
    return <>{children}</>
  }

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputPass.trim()) {
      setErrorMsg('Vui lòng nhập mật khẩu!')
      return
    }

    if (inputPass.trim().toLowerCase() === password?.trim().toLowerCase()) {
      sessionStorage.setItem(`story_pass_${storySlug}`, 'unlocked')
      setIsUnlocked(true)
    } else {
      setErrorMsg('Mật khẩu không đúng! Vui lòng kiểm tra lại.')
    }
  }

  return (
    <div className="py-12 px-4 max-w-md mx-auto font-sans text-center">
      <div className="p-7 sm:p-8 rounded-[28px] border border-[#F2E8DC] dark:border-white/10 bg-white dark:bg-[#241D18] shadow-[0_8px_30px_rgba(80,50,20,0.08)] space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-[#FFF4E7] dark:bg-[#3D2D23] text-[#A45C12] dark:text-[#F4C27A] mx-auto shadow-xs">
          <KeyRound className="size-7" />
        </div>

        <div>
          <h2 className="font-serif text-2xl font-bold text-[#5C3D2E] dark:text-[#EADBC8]">
            Truyện này có mật khẩu
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 leading-relaxed">
            Chủ nhà đã đặt mật khẩu bảo vệ cho tác phẩm này. Vui lòng nhập đúng pass để mở khóa xem nội dung.
          </p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-3 pt-2">
          <Input
            type="password"
            value={inputPass}
            onChange={(e) => {
              setInputPass(e.target.value)
              setErrorMsg('')
            }}
            placeholder="Nhập mật khẩu bảo vệ..."
            className="h-11 rounded-xl text-center bg-stone-50/50 dark:bg-[#1A1615] border-[#EEDFD0] dark:border-white/10 font-bold text-stone-800 dark:text-[#E9D7C3] placeholder:font-normal focus:border-[#D89A52]"
          />

          {errorMsg && (
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              {errorMsg}
            </p>
          )}

          <Button
            type="submit"
            className="w-full h-11 rounded-xl bg-gradient-to-r from-[#F4C27A] to-[#D89A52] hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider shadow-md gap-2"
          >
            <Unlock className="size-4" /> Mở khóa truyện
          </Button>
        </form>

        <div className="pt-3 border-t border-[#F6EBDD] dark:border-white/10">
          <Link
            href="/luu-y"
            className="text-xs font-semibold text-[#A45C12] dark:text-[#F4C27A] hover:underline flex items-center justify-center gap-1"
          >
            <span>Gợi ý giải pass xem tại "Lưu ý của chủ nhà"</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}