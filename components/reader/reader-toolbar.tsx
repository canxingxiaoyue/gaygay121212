'use client'

import { useEffect, useRef } from 'react' // 🌟 BỔ SUNG THÊM HOOK ĐỂ BẮT SỰ KIỆN CLICK OUTSIDE [1]
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ReaderToolbarProps {
  settingsOpen: boolean
  setSettingsOpen: (open: boolean) => void
  isSpeaking: boolean
  handleTTS: () => void
  readerTheme: string
  setReaderTheme: (theme: string) => void
  fontSize: number
  setFontSize: (size: number | ((prev: number) => number)) => void
  fontFamily: string
  setFontFamily: (family: string) => void
  lineHeight: string
  setLineHeight: (lh: string) => void
  containerWidth: string
  setContainerWidth: (cw: string) => void
}

const THEME_LABELS = [
  { id: 'light', label: '☀️ Sáng' },
  { id: 'dark', label: '🌙 Tối' },
  { id: 'sepia', label: '📜 Sepia' },
  { id: 'emerald', label: '🍃 Trà Xanh' },
  { id: 'coffee', label: '☕ Cà Phê' },
  { id: 'rose', label: '🌸 Đào Ngọt' }
]

export function ReaderToolbar({
  settingsOpen,
  setSettingsOpen,
  isSpeaking,
  handleTTS,
  readerTheme,
  setReaderTheme,
  fontSize,
  setFontSize,
  fontFamily,
  setFontFamily,
  lineHeight,
  setLineHeight,
  containerWidth,
  setContainerWidth,
}: ReaderToolbarProps) {
  const activeClass = "bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-amber-500 text-amber-800 dark:text-amber-400 font-bold shadow-[0_0_15px_rgba(245,158,11,0.15)] scale-[1.02]"
  const inactiveClass = "border-stone-200 dark:border-stone-850 hover:border-amber-500/50 text-stone-600 dark:text-stone-400"

  // 🌟 KHỞI TẠO REF ĐỂ THEO DÕI VÙNG CLICK CỦA TOOLBAR [1]
  const toolbarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!settingsOpen) return

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement
      
      // 🌟 THUẬT TOÁN LOẠI TRỪ THÔNG MINH: Bỏ qua nếu bấm vào Radix Portal (khung chọn Font chữ) [1.1.2]
      if (
        target.closest('[data-radix-portal]') || 
        target.closest('[data-radix-select-viewport]')
      ) {
        return
      }

      // Nếu bấm ra ngoài hoàn toàn vùng cài đặt, tiến hành tự động đóng [1]
      if (toolbarRef.current && !toolbarRef.current.contains(target)) {
        setSettingsOpen(false)
      }
    }

    // Lắng nghe sự kiện click chuột trên toàn màn hình
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [settingsOpen, setSettingsOpen])

  return (
    <div
      ref={toolbarRef}
      className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 z-[100] flex flex-col items-end gap-3"
    >
      {settingsOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-72 max-h-[min(28rem,calc(100vh-7rem))] overflow-y-auto rounded-2xl border border-amber-500/20 dark:border-stone-850 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md p-4 shadow-[0_20px_50px_rgba(139,94,60,0.18)] space-y-4 text-sm font-sans text-stone-800 dark:text-stone-200 animate-in fade-in zoom-in-95 duration-200"
        >
      
          {/* THEME */}
          <div className="space-y-2 pb-3 border-b border-stone-100 dark:border-stone-850">
            <span className="font-bold text-stone-700 dark:text-stone-300 block">🎨 Giao diện đọc</span>
            <div className="grid grid-cols-3 gap-2">
              {THEME_LABELS.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setReaderTheme(t.id)}
                  className={cn("py-2 rounded-xl text-xs font-semibold border transition-all duration-300 active:scale-95", readerTheme === t.id ? activeClass : inactiveClass)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* FONTS / SIZES */}
          <div className="space-y-3.5">
            <span className="font-bold text-stone-700 dark:text-stone-300 block">🔠 Tùy chỉnh chữ</span>
            
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-stone-500 dark:text-stone-400">Cỡ chữ:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFontSize((s) => Math.max(14, s - 2))}
                  className="size-6 rounded border border-stone-200 dark:border-stone-850 flex items-center justify-center font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-[#E5D8C8] active:scale-90 transition-all"
                >
                  -
                </button>
                <span className="w-6 text-center font-bold text-stone-800 dark:text-stone-200">{fontSize}</span>
                <button
                  type="button"
                  onClick={() => setFontSize((s) => Math.min(28, s + 2))}
                  className="size-6 rounded border border-stone-200 dark:border-stone-850 flex items-center justify-center font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-[#E5D8C8] active:scale-90 transition-all"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-stone-500 dark:text-stone-400">Font chữ:</span>
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger className="w-[140px] h-7 text-[10px] rounded border-stone-200 dark:border-[#E5D8C8]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[110]">
                  <SelectItem value="serif">Serif (Georgia)</SelectItem>
                  <SelectItem value="quicksand">Quicksand</SelectItem>
                  <SelectItem value="nunito">Nunito</SelectItem>
                  <SelectItem value="lexend">Lexend</SelectItem>
                  <SelectItem value="comfortaa">Comfortaa</SelectItem>
                  <SelectItem value="manrope">Manrope</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-stone-500 dark:text-stone-400">Khoảng dòng:</span>
              <div className="flex gap-1">
                {['normal', 'relaxed', 'loose'].map((lh) => (
                  <button
                    key={lh}
                    type="button"
                    onClick={() => setLineHeight(lh)}
                    className={cn("px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all duration-300", lineHeight === lh ? activeClass : inactiveClass)}
                  >
                    {lh === 'normal' ? 'Hẹp' : lh === 'relaxed' ? 'Vừa' : 'Rộng'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-stone-500 dark:text-stone-400">Chiều rộng:</span>
              <div className="flex gap-1">
                {['xl', '2xl', '3xl'].map((cw) => (
                  <button
                    key={cw}
                    type="button"
                    onClick={() => setContainerWidth(cw)}
                    className={cn("px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all duration-300", containerWidth === cw ? activeClass : inactiveClass)}
                  >
                    {cw === 'xl' ? 'Hẹp' : cw === '2xl' ? 'Vừa' : 'Rộng'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation()
          setSettingsOpen(!settingsOpen)
        }}
        className="size-[46px] rounded-full bg-[#F4EEE6] dark:bg-stone-900 border border-[#E5D8C8] dark:border-stone-850 shadow-xl text-[#8B5E3C] dark:text-[#efebe9] hover:scale-105 active:scale-95 transition-all duration-200"
        title="Tùy chỉnh giao diện đọc"
      >
        <Heart className="size-5 fill-[#8B5E3C] dark:fill-[#efebe9] text-[#8B5E3C] dark:text-[#efebe9]" />
      </Button>
    </div>
  )
}