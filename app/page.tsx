import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, BookOpen, Coffee, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { StoryCard } from '@/components/story-card'
import { STORIES, OWNER_NOTES } from '@/lib/stories'

export default function HomePage() {
  const featured = STORIES.slice(0, 4)
  const popular = [...STORIES].sort((a, b) => b.views - a.views).slice(0, 4)

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 md:grid-cols-2 md:py-16">
            <div className="flex flex-col gap-5">
        <div className="flex w-fit items-center gap-2.5 animate-pulse">
  <Coffee className="size-5 text-amber-600/80" />
  <span className="italic font-serif text-base md:text-lg text-amber-800/90 dark:text-amber-200/90 tracking-wide">
    “Chúc cho mỗi người đều sở hữu bình minh của riêng mình.”
  </span>
</div>
              <h1 className="text-balance font-serif text-4xl font-bold leading-tight md:text-5xl">
               残星晓月
              </h1>
              <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
                残星晓月，为何内心依然眷恋往事？
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/truyen">
                    <BookOpen className="size-4" />
                    Bắt đầu đọc
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/da-hoan-thanh">Truyện đã hoàn thành</Link>
                </Button>
              </div>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border shadow-lg">
              <Image
                src="/hero-reading.png"
                alt="Một cuốn sách mở bên tách cà phê nóng"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        {/* Featured */}
        <section className="mx-auto max-w-6xl px-4 py-12">
          <SectionHeader
            title="Truyện mới nổi bật"
            desc="Những câu chuyện đang được quán giới thiệu"
            href="/truyen"
          />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {featured.map((s) => (
              <StoryCard key={s.slug} story={s} />
            ))}
          </div>
        </section>

        {/* Popular */}
        <section className="border-y border-border bg-card">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <SectionHeader
              title="Được đọc nhiều nhất"
              desc="Bảng xếp hạng theo lượt đọc tại quán"
              href="/truyen"
            />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {popular.map((s) => (
                <StoryCard key={s.slug} story={s} />
              ))}
            </div>
          </div>
        </section>

        {/* Owner note teaser */}
        <section className="mx-auto max-w-6xl px-4 pb-12">
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-secondary p-8 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Sparkles className="size-6" />
              </span>
              <div>
                <h2 className="font-serif text-2xl font-bold">
                  Đôi lời từ chủ quán
                </h2>
                <p className="mt-1 max-w-xl text-pretty leading-relaxed text-muted-foreground">
                  {OWNER_NOTES[0].body}
                </p>
              </div>
            </div>
            <Button asChild variant="default" className="shrink-0">
              <Link href="/luu-y">
                Xem tất cả lưu ý
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

function SectionHeader({
  title,
  desc,
  href,
}: {
  title: string
  desc: string
  href: string
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-serif text-2xl font-bold md:text-3xl">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </div>
      <Link
        href={href}
        className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline sm:flex"
      >
        Xem tất cả <ArrowRight className="size-4" />
      </Link>
    </div>
  )
}
