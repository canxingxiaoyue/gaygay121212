'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes'

// Sửa lỗi React 19 chặn thẻ <script> của next-themes khi chạy ở môi trường phát triển (development)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const orig = console.error
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Encountered a script tag')) return
    orig.apply(console, args)
  }
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}