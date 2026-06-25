'use client'

import * as React from "react"
import { useState, useEffect } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Tránh lỗi Hydration mismatch (bất đồng bộ giao diện) giữa Server và Client của Next.js
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="size-9 rounded-full" aria-hidden>
        <Sun className="h-[1.2rem] w-[1.2rem] text-stone-400" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="size-9 rounded-full transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
      title="Đổi giao diện Sáng/Tối"
    >
      {/* Icon Mặt Trời: Xoay tròn và biến mất khi chuyển sang tối */}
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
      
      {/* Icon Mặt Trăng: Xoay tròn và hiện lên khi chuyển sang tối */}
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-stone-600 dark:text-stone-300" />
      
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}