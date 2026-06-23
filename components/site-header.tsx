'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs' // <-- Sử dụng Clerk lấy thông tin người dùng
import { ArrowRight, Coffee, Menu, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { AccountMenu } from '@/components/account-menu'
import { ThemeToggle } from '@/components/theme-toggle'
import { NotificationBell } from '@/components/notification-bell'

const NAV = [
  { href: '/', label: 'Trang chủ' },
  { href: '/truyen', label: 'Tủ truyện' },
  { href: '/tim-kiem', label: 'Tìm kiếm' }, // <-- ĐÃ SỬA THÀNH TÌM KIẾM CHUẨN XÁC
  { href: '/luu-y', label: 'Lưu ý của chủ nhà' }, 
  { href: '/yeu-thich', label: 'Yêu thích' },
]

export function SiteHeader() {
  const { user, isSignedIn } = useUser() // Thao tác lấy tài khoản hiện tại từ Clerk
  const pathname = usePathname()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  // Kiểm tra quyền Admin (ID Clerk trùng khớp)
  const isAdmin = isSignedIn && user?.id === process.env.NEXT_PUBLIC_ADMIN_ID

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    router.push(q ? `/truyen?q=${encodeURIComponent(q)}` : '/truyen')
    setMobileOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 shrink-0 hover:opacity-90 transition-opacity select-none">
          <span className="font-serif text-xl font-bold tracking-tight">
            ⋆｡˚☾Tàn Tinh Hiểu Nguyệt ☽˚｡⋆
          </span>
        </Link>
      <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-full px-2.5 py-2 text-sm font-semibold transition-colors whitespace-nowrap',
                  active
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            )
          })}

          {/* HIỂN THỊ NÚT ĐĂNG TRUYỆN MỚI TRÊN DESKTOP CHO RIÊNG ADMIN */}
          {isAdmin && (
            <Link
              href="/admin/new-story"
              className={cn(
                'rounded-full px-2.5 py-2 text-sm font-bold transition-colors whitespace-nowrap',
                pathname === '/admin/new-story'
                  ? 'bg-secondary text-amber-800 dark:text-amber-400'
                  : 'text-amber-800 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300',
              )}
            >
              Đăng truyện mới
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <form onSubmit={submitSearch} className="hidden md:block">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm truyện..."
                className="w-44 rounded-full pl-9"
              />
            </div>
          </form>
          <ThemeToggle />
          <NotificationBell />
          <AccountMenu />

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Mở menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="font-serif text-xl">Tàn Tinh Hiểu Nguyệt</SheetTitle>
              </SheetHeader>
              <form onSubmit={submitSearch} className="px-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Tìm truyện..."
                    className="w-full rounded-full pl-9"
                  />
                </div>
              </form>
              <nav className="flex flex-col gap-1 px-4">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-2 text-sm font-semibold text-foreground hover:bg-secondary"
                  >
                    {item.label}
                  </Link>
                ))}

                {/* HIỂN THỊ NÚT ĐĂNG TRUYỆN MỚI TRÊN MOBILE CHO RIÊNG ADMIN */}
                {isAdmin && (
                  <Link
                    href="/admin/new-story"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-2 text-sm font-bold text-amber-800 dark:text-amber-400 hover:bg-secondary"
                  >
                    Đăng truyện mới
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
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