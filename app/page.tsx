import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, BookOpen, Coffee, Sparkles, Star, Moon } from 'lucide-react' // Giữ nguyên để tránh lỗi biên dịch
import { Button } from '@/components/ui/button'
import { SiteHeader } from '@/components/site-header'
import { StoryCard } from '@/components/story-card'
import { getMergedStories } from '@/app/actions/admin'

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
            <div className="flex flex-col gap-5 text-left">
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

            {/* Cột bên phải: 🌟 KHUNG BẦU TRỜI THIÊN VĂN HIỆN ĐẠI, SANG TRỌNG & SỐNG ĐỘNG (BẢN TINH CHỈNH TINH TẾ) */}
            <div className="relative aspect-video w-full rounded-3xl border border-stone-200/40 dark:border-stone-800 shadow-2xl overflow-hidden select-none transition-all duration-500">
              {/* Nhúng mã CSS Animation lấp lánh tự đóng gói */}
              <style dangerouslySetInnerHTML={{ __html: `
                @keyframes twinkle {
                  0%, 100% { opacity: 0.2; transform: scale(0.85); }
                  50% { opacity: 1; transform: scale(1.15); }
                }
                .animate-twinkle-fast {
                  animation: twinkle 3s infinite ease-in-out;
                }
                .animate-twinkle-medium {
                  animation: twinkle 4.5s infinite ease-in-out;
                }
                .animate-twinkle-slow {
                  animation: twinkle 6s infinite ease-in-out;
                }
              `}} />

              {/* 1. HAI LỚP ẢNH NỀN FADE MƯỢT MÀ THEO LIGHT/DARK MODE */}
              {/* Ảnh nền Light Mode (Ban ngày) */}
              <Image
                src="/sky-light.png"
                alt="Sky Light"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="absolute top-0 left-0 w-full h-full object-cover scale-[1.06] opacity-100 dark:opacity-0 transition-all duration-500 ease-in-out"
                priority
              />
              {/* Ảnh nền Dark Mode (Ban đêm) */}
              <Image
                src="/Bautroidem.png"
                alt="Sky Dark"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="absolute top-0 left-0 w-full h-full object-cover scale-[1.06] opacity-0 dark:opacity-100 transition-all duration-500 ease-in-out"
                priority
              />

              {/* 2. CHÒM SAO LẤP LÁNH ĐÈ LÊN TRÊN (CHỈ BẬT RÕ NÉT Ở DARK MODE) */}
              <div className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-500">
                {/* Sao lớn lấp lánh */}
                <div className="absolute top-[25%] left-[18%] w-1.5 h-1.5 bg-white rounded-full animate-twinkle-slow filter drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]" />
                <div className="absolute top-[45%] left-[35%] w-1.5 h-1.5 bg-yellow-100 rounded-full animate-twinkle-medium filter drop-shadow-[0_0_3px_rgba(253,224,71,0.6)]" />
                <div className="absolute bottom-[40%] right-[32%] w-1.5 h-1.5 bg-white rounded-full animate-twinkle-fast filter drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]" />
                
                {/* Sao nhỏ lấp lánh */}
                <div className="absolute top-[15%] right-[25%] w-1 h-1 bg-white rounded-full animate-twinkle-fast" />
                <div className="absolute bottom-[28%] left-[22%] w-1 h-1 bg-blue-100 rounded-full animate-twinkle-slow" />
                <div className="absolute top-[60%] right-[40%] w-1 h-1 bg-white rounded-full animate-twinkle-medium" />
                
                {/* Sao cực nhỏ */}
                <div className="absolute top-[35%] right-[12%] w-[2px] h-[2px] bg-white rounded-full animate-twinkle-slow opacity-60" />
                <div className="absolute bottom-[55%] left-[10%] w-[2px] h-[2px] bg-white rounded-full animate-twinkle-fast opacity-80" />
              </div>
            </div>

          </div>
        </section>

        {/* Featured Section */}
        <section className="mx-auto max-w-6xl px-4 py-12">
          <SectionHeader title="Truyện mới nổi bật" desc="Hàng mới ra lò" href="/truyen" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {featured.map((s) => (
              <StoryCard key={s.slug} story={s} />
            ))}
          </div>
        </section>

        {/* Popular Section */}
        <section className="border-y border-border bg-card">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <SectionHeader title="Được đọc nhiều nhất" desc="Bảng xếp hạng theo lượt đọc" href="/truyen" />
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