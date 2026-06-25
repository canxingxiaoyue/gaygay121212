import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, BookOpen, Coffee, Sparkles, Star, Moon } from 'lucide-react' // 🌟 Đã thêm Star và Moon
import { Button } from '@/components/ui/button'
import { SiteHeader } from '@/components/site-header'
import { StoryCard } from '@/components/story-card'
import { getMergedStories } from '@/app/actions/admin' // <-- Đã đổi import gọi hàm gộp truyện

export default async function HomePage() { 
  // Lấy danh sách truyện đã gộp từ Database và CHỈ hiển thị truyện đang công khai (true)
  const allStories = await getMergedStories(true) 

  const featured = allStories.slice(0, 4)
  const popular = [...allStories].sort((a, b) => b.views - a.views).slice(0, 4)

  return (
    <div className="flex min-h-screen flex-col animate-fade-in">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 md:grid-cols-2 md:py-16">
            <div className="flex flex-col gap-5">
              <p className="italic font-serif text-lg md:text-xl text-amber-800/80 dark:text-amber-200/80 tracking-wide">
                “Chúc cho mỗi người đều sở hữu bình minh của riêng mình.”
              </p>
              <h1 className="text-balance font-serif text-4xl font-bold leading-tight md:text-5xl text-stone-800 dark:text-stone-100">
               残星晓月
              </h1>
              <p className="text-pretty text-lg leading-relaxed text-stone-600 dark:text-stone-300">
                残星晓月，为何内心依然眷恋往事？
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-[#5C3D2E] hover:bg-[#4A2E22] text-white rounded-xl shadow-md transition-all hover:scale-[1.02] border-none">
                  <Link href="/tim-kiem">
                    <BookOpen className="size-4 mr-2" />
                    Bắt đầu đọc
                  </Link>
                </Button>
                
                {/* Nút truyện hoàn thành */}
                <Button asChild size="lg" variant="outline" className="bg-[#FBF9F6] dark:bg-stone-900 border border-[#E5D8C8] dark:border-stone-800 text-[#5C3D2E] dark:text-stone-200 hover:bg-[#F4EEE6] dark:hover:bg-stone-800 rounded-xl transition-all hover:scale-[1.02]">
                  <Link href="/truyen">Tủ truyện</Link>
                </Button>
              </div>
            </div>

            {/* Cột bên phải: 🌟 KHUNG ẢNH TRANG TRÍ PHONG CÁCH HOÀNG HÔN LUNG LINH */}
            <div className="flex flex-col gap-2">
              
              {/* Khung tranh nền Gradient bầu trời chuyển màu thơ mộng */}
              <div className="relative aspect-video rounded-3xl border border-stone-200/40 dark:border-stone-800 shadow-xl overflow-hidden bg-gradient-to-b from-[#7c86b2] via-[#b6bccd] to-[#fceea7] p-6 flex items-center justify-center select-none">
                
                {/* 1. Đường viền đứt nét viền quanh khung (Dashed outline) */}
                <div className="absolute inset-3 rounded-[1.25rem] border-2 border-dashed border-white/30 pointer-events-none" />

                {/* 2. CÁC ICON TRANG TRÍ DỄ THƯƠNG Ở KHUNG NGOÀI */}
                {/* Ngôi sao vàng lớn trên bên trái */}
                <div className="absolute top-5 left-5 -rotate-12 drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] animate-bounce" style={{ animationDuration: '3s' }}>
                  <Star className="size-6 text-[#fcefa8] fill-[#fcefa8]" />
                </div>
                {/* Ngôi sao vàng lớn trên bên phải */}
                <div className="absolute top-5 right-5 rotate-12 drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] animate-bounce" style={{ animationDuration: '4s' }}>
                  <Star className="size-6 text-[#fcefa8] fill-[#fcefa8]" />
                </div>
                {/* Trăng khuyết vàng dưới bên trái */}
                <div className="absolute bottom-5 left-5 -rotate-12 drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">
                  <Moon className="size-7 text-[#fcefa8] fill-[#fcefa8]" />
                </div>
                {/* Ngôi sao nhỏ lấp lánh dưới bên phải */}
                <div className="absolute bottom-5 right-5 rotate-45 drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">
                  <Sparkles className="size-5 text-[#fcefa8] fill-[#fcefa8]" />
                </div>

                {/* 3. Khung trắng bo góc chứa bức tranh chính ở giữa */}
              <div className="relative w-[90%] h-[85%] bg-white rounded-2xl shadow-inner overflow-hidden flex items-center justify-center z-10">
  <Image
    src="/kemchanh.png"
    alt="Artist: Kem chanh màu xanh"
    fill
    priority
    className="object-contain" // 🌟 ĐÃ SỬA: Chuyển về object-contain để ảnh không bao giờ bị cắt xén [1]
  />
</div>
              </div>

              {/* Chú thích phía dưới */}
              <p className="text-center text-sm font-sans text-stone-500 dark:text-stone-400 italic">
                Artist: Kem chanh màu xanh
              </p>
            </div>
          </div>
        </section>

        {/* Featured Section */}
        <section className="mx-auto max-w-6xl px-4 py-12">
          <SectionHeader title="Truyện mới nổi bật" desc="Những câu chuyện đang được quán giới thiệu" href="/truyen" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {featured.map((s) => (
              <StoryCard key={s.slug} story={s} />
            ))}
          </div>
        </section>

        {/* Popular Section */}
        <section className="border-y border-border bg-card">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <SectionHeader title="Được đọc nhiều nhất" desc="Bảng xếp hạng theo lượt đọc tại quán" href="/truyen" />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {popular.map((s) => (
                <StoryCard key={s.slug} story={s} />
              ))}
            </div>
          </div>
        </section>

        {/* THANH LƯU Ý */}
        <section className="w-full bg-transparent border-y border-stone-200/40 py-16 flex justify-center items-center px-4">
          <div className="w-full max-w-xl group flex flex-col gap-4 rounded-2xl border border-[#E5D8C8] dark:border-[#3a2d27] bg-[#F4EEE6] dark:bg-[#231a16] p-5 transition-all duration-300 hover:border-[#D5C1AA] hover:bg-[#F7F1EA] dark:hover:bg-[#2d211c] md:flex-row md:items-center md:justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EADBC8] dark:bg-[#3d2a21]">
                <Sparkles className="size-5 text-[#8B5E3C] dark:text-[#d7ccc8]" />
              </div>
              <h2 className="font-serif text-base md:text-lg font-bold text-[#5C3D2E] dark:text-[#efebe9] leading-tight">
                Vài lời cần lưu ý của chủ nhà
              </h2>
            </div>

            <Link
              href="/luu-y"
              className="flex items-center gap-2 text-sm font-semibold text-[#8B5E3C] dark:text-[#d7ccc8] transition-colors hover:text-[#6F472D] dark:hover:text-[#efebe9] shrink-0"
            >
              Xem tất cả lưu ý
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}

function SectionHeader({ title, desc, href }: { title: string; desc: string; href: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-serif text-2xl font-bold md:text-3xl text-stone-800 dark:text-stone-100">{title}</h2>
        <p className="mt-1 text-sm text-stone-500">{desc}</p>
      </div>
      <Link href={href} className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline sm:flex">
        Xem tất cả <ArrowRight className="size-4" />
      </Link>
    </div>
  )
}