'use client'

import { SlidersHorizontal, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { THEME_MAPPING, FONT_MAPPING } from './reader-constants'
import { cn } from '@/lib/utils'

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
  setLineHeight: (height: string) => void
  containerWidth: string
  setContainerWidth: (width: string) => void
}

export function ReaderToolbar({
  settingsOpen,
  setSettingsOpen,
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
  return (
    // ĐỆM PHÍM CHỨC NĂNG FLOATING CỐ ĐỊNH GÓC DƯỚI
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3 font-cute-quicksand">
      {/* Nhúng mã tải font chữ Comfortaa và Quicksand mượt mà đồng bộ trực tiếp */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@600;700&family=Quicksand:wght@500;600;700&display=swap');
        .font-cute-quicksand {
          font-family: 'Quicksand', sans-serif !important;
        }
        .font-cute-comfortaa {
          font-family: 'Comfortaa', sans-serif !important;
        }
      `}} />

      {/* 🌟 CARD CHỈNH SỬA GIAO DIỆN CONCEPT MOON CAT (ĐÃ ĐƯỢC CHỐNG LỖI CẮT CHỮ TRÊN MỌI THIẾT BỊ) [1, 3] */}
      {settingsOpen && (
        <div className={cn(
          "relative w-[290px] sm:w-[320px] p-5.5 rounded-[22px] border shadow-md flex flex-col gap-4 animate-in slide-in-from-bottom-2 fade-in duration-200 overflow-hidden",
          THEME_MAPPING[readerTheme]?.container
        )}>
          {/* Tiêu đề góc đọc của mèo */}
          <div className="flex items-center gap-1.5 pb-2.5 border-b border-stone-200/40 dark:border-stone-850/40">
            <span className="text-sm font-bold text-stone-800 dark:text-stone-200 font-cute-comfortaa flex items-center gap-1.5">
              🌙 Góc đọc của mèo
            </span>
          </div>

          {/* Lựa chọn companion (Theme chuyển đổi mượt mà) */}
          <div className="grid grid-cols-3 gap-1.5">
            {Object.entries(THEME_MAPPING).map(([key, value]) => {
              const active = readerTheme === key
              return (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  onClick={() => setReaderTheme(key)}
                  className={cn(
                    "h-9 rounded-full text-[9px] sm:text-[10px] border !px-1 select-none flex items-center justify-center font-bold tracking-tighter relative transition-all duration-200 group active:scale-95 shadow-sm w-full", // 🌟 SỬA: Đã thêm !px-1 để ghi đè triệt để padding của shadcn button [MỚI]
                    active 
                      ? cn(value.activeItem, value.accentBorder, "border-2 scale-[1.02] shadow-[0_2px_8px_rgba(0,0,0,0.03)]") 
                      : "border-stone-250/50 hover:border-stone-400/50 bg-stone-50/10 text-stone-600 dark:border-stone-850 dark:hover:bg-stone-800 dark:text-stone-300 dark:hover:text-stone-100"
                  )}
                >
                  {/* 🌟 SỬA: Xóa bỏ hoàn toàn class truncate, thay thế bằng whitespace-nowrap để gỡ bỏ vĩnh viễn dấu ba chấm lửng lơ [MỚI] */}
                  <span className="z-10 whitespace-nowrap text-[9px] sm:text-[9.5px] tracking-tighter">
                    {value.name}
                  </span>
                  {/* Ngôi sao nhỏ xuất hiện khi hover bé mèo */}
                  <span className="absolute top-1 right-1 text-[7px] opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none">✦</span>
                </Button>
              )
            })}
          </div>

          {/* DIVIDER CHÒM SAO OPACITY THẤP */}
          <div className="flex items-center justify-center text-[9px] opacity-[0.15] select-none pointer-events-none py-0.5 text-stone-400 dark:text-stone-500">
            ⋆ ────── ☾ ────── ⋆
          </div>

          {/* Tiêu đề tùy chỉnh chữ */}
          <div className="flex items-center gap-1.5 pb-1">
            <span className="text-xs font-bold text-stone-800 dark:text-stone-200 font-cute-comfortaa flex items-center gap-1.5">
              📖 Tùy chỉnh chữ
            </span>
          </div>

          {/* Các nút căn chỉnh tinh tế */}
          <div className="space-y-3 font-cute-quicksand">
            {/* Cỡ chữ */}
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
              <span className="font-semibold tracking-wider">Cỡ chữ:</span>
              <div className="flex items-center gap-2.5">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setFontSize(prev => Math.max(12, prev - 1))}
                  className="size-8 rounded-full flex items-center justify-center hover:text-amber-800 dark:hover:text-amber-400 border-stone-250/60 dark:border-stone-850 transition-colors relative group active:scale-95"
                >
                  <Minus className="size-2.5 shrink-0" />
                  <span className="absolute -top-4 text-[7px] opacity-0 group-hover:opacity-60 transition-opacity">✦</span>
                </Button>
                <span className="font-bold min-w-[20px] text-center text-[13px] text-stone-700 dark:text-stone-300">{fontSize}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setFontSize(prev => Math.min(30, prev + 1))}
                  className="size-8 rounded-full flex items-center justify-center hover:text-amber-800 dark:hover:text-amber-400 border-stone-250/60 dark:border-stone-850 transition-colors relative group active:scale-95"
                >
                  <Plus className="size-2.5 shrink-0" />
                  <span className="absolute -top-4 text-[7px] opacity-0 group-hover:opacity-60 transition-opacity">🐾</span>
                </Button>
              </div>
            </div>

            {/* Font chữ sạch sẽ, áp dụng trực tiếp font để render tên */}
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
              <span className="font-semibold tracking-wider">Font chữ:</span>
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger className="w-[130px] sm:w-[155px] h-8.5 rounded-full text-xs font-semibold focus:ring-0 border-stone-250/60 dark:border-stone-850 bg-stone-50/10 hover:bg-stone-100/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[110] font-cute-quicksand">
                  {Object.entries(FONT_MAPPING).map(([key, value]) => (
                    <SelectItem key={key} value={key} className="cursor-pointer">
                      <span style={{ fontFamily: value }} className="text-[12px]">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Khoảng dòng */}
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
              <span className="font-semibold tracking-wider">Khoảng dòng:</span>
              <div className="flex gap-1.5">
                {['normal', 'relaxed', 'loose'].map((v) => {
                  const active = lineHeight === v
                  return (
                    <Button
                      key={v}
                      variant="outline"
                      onClick={() => setLineHeight(v)}
                      className={cn(
                        "h-7 px-3 text-[10.5px] rounded-full font-semibold border active:scale-95 transition-all duration-150",
                        active 
                          ? THEME_MAPPING[readerTheme]?.activeSelection 
                          : "border-stone-250/60 hover:bg-stone-100/50 dark:border-stone-850 text-stone-500 dark:text-stone-400"
                      )}
                    >
                      {v === 'normal' ? 'Hẹp' : v === 'relaxed' ? 'Vừa' : 'Rộng'}
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Chiều rộng */}
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
              <span className="font-semibold tracking-wider">Chiều rộng:</span>
              <div className="flex gap-1.5">
                {['xl', '2xl', '3xl'].map((v) => {
                  const active = containerWidth === v
                  return (
                    <Button
                      key={v}
                      variant="outline"
                      onClick={() => setContainerWidth(v)}
                      className={cn(
                        "h-7 px-3 text-[10.5px] rounded-full font-semibold border active:scale-95 transition-all duration-150",
                        active 
                          ? THEME_MAPPING[readerTheme]?.activeSelection 
                          : "border-stone-250/60 hover:bg-stone-100/50 dark:border-stone-850 text-stone-500 dark:text-stone-400"
                      )}
                    >
                      {v === 'xl' ? 'Hẹp' : v === '2xl' ? 'Vừa' : 'Rộng'}
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nút cài đặt trôi nổi duy nhất ở góc dưới phải */}
      <Button
        onClick={() => setSettingsOpen(!settingsOpen)}
        variant="outline"
        size="icon"
        className="h-11 w-11 rounded-full border border-stone-200 dark:border-stone-800 hover:bg-[#F4EEE6] dark:hover:bg-stone-800 text-stone-600 hover:text-[#5C3D2E] dark:text-stone-400 dark:hover:text-stone-100 shadow-lg active:scale-95 transition-all"
        title="Góc cài đặt đọc"
      >
        <SlidersHorizontal className="size-4.5" />
      </Button>
    </div>
  )
}