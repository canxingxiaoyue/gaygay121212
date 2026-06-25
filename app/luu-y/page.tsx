import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ChevronRight, Home, Sparkles, Star, Moon } from 'lucide-react' // 🌟 Đã xóa Coffee khỏi import

// DANH SÁCH 4 ĐIỀU LƯU Ý
const NOTES = [
  { id: 1, body: 'Nhà của tớ dùng để chia sẻ tất cả những sở thích của tớ, chủ yếu là truyện niên hạ.' },
  { id: 2, body: 'Tớ không đọc sinh tử văn, ABO (AO), tra công tiện thụ, còn lại cái gì cũng húp.' },
  { id: 3, body: 'Không được phép đăng lại, sử dụng nội dung trong blog của tớ với mục đích lợi nhuận.' },
  { id: 4, body: 'Sử dụng ngôn từ lịch sự, tôn trọng chủ nhà cũng như các khách đến thăm khác.' }
]

export default function OwnerNotesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FDF8F1] dark:bg-stone-950 relative overflow-hidden">
      <SiteHeader />

      {/* 🌟 HỆ THỐNG TRANG TRÍ MOONLIGHT & STARDUST LƠ LỬNG Ở NỀN TRANG */}
      {/* 1. Trăng khuyết màu vàng champagne lơ lửng ở góc trên bên phải (chuyển động chậm) */}
      <div className="absolute top-24 right-[10%] opacity-35 pointer-events-none animate-bounce" style={{ animationDuration: '6s' }}>
        <Moon className="size-16 text-[#F2C94C] fill-[#F2C94C] drop-shadow-[0_0_15px_rgba(242,201,76,0.3)]" />
      </div>

      {/* 2. Các cụm sao lấp lánh (Stardust) ẩn hiện nhẹ nhàng dưới nền */}
      <div className="absolute top-40 left-[12%] opacity-30 pointer-events-none animate-pulse" style={{ animationDuration: '3s' }}>
        <Sparkles className="size-8 text-[#F2C94C]" />
      </div>
      <div className="absolute bottom-42 right-[15%] opacity-25 pointer-events-none animate-pulse" style={{ animationDuration: '4s' }}>
        <Star className="size-6 text-[#F2C94C] fill-[#F2C94C]" />
      </div>
      <div className="absolute top-1/2 left-8 -translate-y-1/2 opacity-20 pointer-events-none animate-pulse" style={{ animationDuration: '5s' }}>
        <Star className="size-5 text-[#fcefa8] fill-[#fcefa8]" />
      </div>
      <div className="absolute top-1/3 right-10 opacity-25 pointer-events-none animate-bounce" style={{ animationDuration: '7s' }}>
        <Sparkles className="size-4 text-[#fcefa8]" />
      </div>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 z-10">
        {/* Đường dẫn Breadcrumbs */}
        <nav className="mb-8 flex items-center gap-1 text-sm text-stone-500">
          <Link href="/" className="flex items-center gap-1 hover:text-stone-800 dark:hover:text-stone-200">
            <Home className="size-3.5" /> Trang chủ
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="text-stone-800 font-semibold dark:text-stone-200">Lưu ý của chủ nhà</span>
        </nav>

        {/* Tiêu đề trang được trang trí bụi sao lấp lánh đối xứng 2 bên */}
        <div className="flex flex-col items-center justify-center mb-12 relative text-center">
          
          <div className="relative">
            {/* Ngôi sao nhỏ lấp lánh nhấp nháy bên lề trái */}
            <div className="absolute top-1/2 -translate-y-1/2 -left-8 opacity-75">
              <Sparkles className="size-4 text-[#8B5E3C] dark:text-[#EADBC8] animate-pulse" />
            </div>
            {/* Ngôi sao nhỏ vàng champagne lấp lánh bên lề phải */}
            <div className="absolute top-1/2 -translate-y-1/2 -right-8 opacity-75">
              <Star className="size-3.5 text-[#F2C94C] fill-[#F2C94C] animate-ping" style={{ animationDuration: '3s' }} />
            </div>

            <h1 className="font-serif text-3xl md:text-4xl font-bold text-stone-800 dark:text-stone-100 tracking-wide">
              Lưu ý của chủ nhà
            </h1>
          </div>

          <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-2.5 font-sans uppercase tracking-widest flex items-center gap-1.5">
            <span>✨</span> Cảm ơn bạn đã ghé qua <span>✨</span>
          </p>
        </div>

        {/* THIẾT KẾ THẺ LƯU Ý HIỆU ỨNG KÍNH MỜ VÀNG CHAMPAGNE */}
        <div className="space-y-4 max-w-2xl mx-auto">
          {NOTES.map((note) => (
            <div 
              key={note.id} 
              className="flex items-center gap-4 bg-white/70 dark:bg-stone-900/60 backdrop-blur-md p-5 rounded-2xl border border-[#E5D8C8]/60 dark:border-stone-800/60 shadow-sm hover:border-[#8B5E3C] dark:hover:border-amber-700/60 hover:shadow-md hover:scale-[1.01] transition-all duration-300 group"
            >
              {/* Số thứ tự tròn màu champagne gold nổi bật */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EADBC8] dark:bg-[#3d2a21] text-[#8B5E3C] dark:text-[#EADBC8] text-xs font-bold font-sans border border-[#E5D8C8]/40 dark:border-stone-700 shadow-inner group-hover:scale-105 transition-transform">
                {note.id}
              </div>
              
              {/* Nội dung lưu ý */}
              <p className="text-sm sm:text-base text-stone-700 dark:text-stone-200 leading-relaxed font-sans font-medium">
                {note.body}
              </p>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}