import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Coffee, ChevronRight, Home } from 'lucide-react'

// DANH SÁCH 6 ĐIỀU LƯU Ý CHUẨN XÁC TỪ ẢNH CHỤP MÀN HÌNH CỦA BẠN
const NOTES = [
  { id: 1, body: 'Nhà của tớ dùng để chia sẻ tất cả những sở thích của tớ, chủ yếu là truyện niên hạ.' },
  { id: 2, body: 'Tớ không đọc sinh tử văn, ABO (AO), tra công tiện thụ, còn lại cái gì cũng húp.' },
  { id: 3, body: 'Bạn đến ghé chơi có thể tham quan, nhưng không được reup.' },
  { id: 4, body: 'Không được phép đăng lại, sử dụng nội dung trong blog của tớ với mục đích lợi nhuận.' },
  { id: 5, body: 'Những tác phẩm fanwork về cp tớ sẽ đặt pass, pass là tên của cp đó không dấu không cách không viết hoa. Ví dụ: Lăng Ngọc thì pass sẽ là langngoc.' },
  { id: 6, body: 'Sử dụng ngôn từ lịch sự, tôn trọng chủ nhà cũng như các khách đến thăm khác.' }
]

export default function OwnerNotesPage() {
  return (
    // Dùng dark:bg-transparent để tự động lộ ra màu nền hạt cà phê tối của body khi bật Dark Mode
    <div className="flex min-h-screen flex-col bg-[#FDF8F1] dark:bg-transparent">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        {/* Đường dẫn Breadcrumbs */}
        <nav className="mb-6 flex items-center gap-1 text-sm text-stone-500">
          <Link href="/" className="flex items-center gap-1 hover:text-stone-800">
            <Home className="size-3.5" /> Trang chủ
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="text-stone-800 dark:text-stone-100 font-semibold">Lưu ý của chủ nhà</span>
        </nav>

        {/* Tiêu đề trang */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EADBC8] dark:bg-[#3d2a21] mb-4 shadow-sm">
            <Coffee className="size-6 text-[#8B5E3C] dark:text-[#d7ccc8]" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-stone-800 dark:text-stone-100">
            Lưu ý của chủ nhà
          </h1>
        </div>

        {/* Danh sách các thẻ lưu ý */}
        <div className="space-y-4">
          {NOTES.map((note) => (
            <div 
              key={note.id} 
              // Đã cấu hình đổi màu card bg-white sang dark:bg-card (màu nâu tối của card) và đổi màu viền sang dark:border-stone-800/40
              className="flex items-start gap-4 bg-white dark:bg-card p-5 rounded-2xl border border-stone-200/60 dark:border-stone-800/40 shadow-sm transition-all hover:scale-[1.01]"
            >
              {/* Vòng tròn số thứ tự tự động chuyển tông nâu đen trầm ấm khi tối */}
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#EADBC8] dark:bg-stone-800 text-sm font-bold text-[#5C3D2E] dark:text-stone-300">
                {note.id}
              </span>
              {/* Nội dung chữ tự động đổi sang màu sáng sữa d7ccc8 dễ đọc */}
              <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed pt-1">
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