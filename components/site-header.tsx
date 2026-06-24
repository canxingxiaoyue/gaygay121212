'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs' // <-- Sử dụng Clerk lấy thông tin người dùng
import { ArrowRight, Menu, Search } from 'lucide-react'
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
    // 🌟 ĐÃ NÂNG LỚP HIỂN THỊ LÊN z-[150] ĐỂ ĐẢM BẢO KHÔNG BỊ PHẦN TỬ KHÁC ĐÈ LÊN [1.1.2]
    <header className="sticky top-0 z-[150] border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        
        {/* LOGO: GIỮ NGUYÊN ĐẦY ĐỦ TTHT VỚI KÝ TỰ CỔ ĐIỂN CỦA BẠN (CỠ CHỮ THU NHỎ TỶ LỆ TRÊN DI ĐỘNG) [1.1.2] */}
        <Link href="/" className="flex items-center shrink-0 hover:opacity-90 transition-opacity select-none min-w-0">
          <span className="font-serif text-[15px] sm:text-lg lg:text-xl font-bold tracking-tight whitespace-nowrap">
            ⋆｡˚☾Tàn Tinh Hiểu Nguyệt ☽˚｡⋆
          </span>
        </Link>

        {/* ĐIỀU HƯỚNG MÁY TÍNH (AN TOÀN TRÊN lg) */}
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

        {/* CONTAINER CHỨA CÁC NÚT ĐIỀU KHIỂN ĐÃ CO GIÃN THEO DI ĐỘNG [1.1.2] */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* 🌟 CHỈ HIỂN THỊ TRÊN MÀY TÍNH (lg): KHUNG SEARCH VÀ CÁC ICON TIỆN ÍCH [1.1.2] */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <form onSubmit={submitSearch}>
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
          </div>

          {/* 🌟 DI ĐỘNG (DƯỚI lg): CHỈ HIỆN DUY NHẤT NÚT BA GẠCH [1.1.2] */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden rounded-full hover:bg-secondary"
                aria-label="Mở menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            
            {/* 🌟 NÂNG CẤP MENU BA GẠCH DI ĐỘNG: GOM TOÀN BỘ CHỨC NĂNG BÊN LỀ VÀO TRONG [1.1.2] */}
            <SheetContent side="right" className="w-72 flex flex-col gap-5 pt-6 font-sans">
              <SheetHeader className="text-left border-b border-stone-100 dark:border-stone-850 pb-3">
                <SheetTitle className="font-serif text-lg tracking-tight">
                  Tàn Tinh Hiểu Nguyệt
                </SheetTitle>
              </SheetHeader>

              {/* 1. Thanh tìm kiếm trên mobile [1.1.2] */}
              <form onSubmit={submitSearch} className="px-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Tìm kiếm tác phẩm..."
                    className="w-full rounded-full pl-9 h-9 text-xs"
                  />
                </div>
              </form>

              {/* 2. Dòng tiện ích phụ xếp cạnh nhau siêu đẹp: Theme, Chuông, Avatar Đăng nhập [1.1.2] */}
              <div className="flex items-center justify-between px-3 py-2 border-y border-stone-100 dark:border-stone-850/60 bg-stone-50/50 dark:bg-stone-950/20 rounded-2xl mx-2">
                <span className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Hộp tiện ích:</span>
                <div className="flex items-center gap-2.5">
                  <ThemeToggle />
                  <NotificationBell />
                  <AccountMenu />
                </div>
              </div>

              {/* 3. Luồng điều hướng các mục chính của Web */}
              <nav className="flex flex-col gap-1 px-2 mt-2">
                <span className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2 px-1">Danh mục chính:</span>
                {NAV.map((item) => {
                  const active =
                    item.href === '/'
                      ? pathname === '/'
                      : pathname.startsWith(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-colors flex items-center justify-between",
                        active 
                          ? "bg-secondary text-secondary-foreground font-bold" 
                          : "text-stone-600 dark:text-stone-300 hover:bg-stone-100/50 dark:hover:bg-stone-850"
                      )}
                    >
                      {item.label}
                    </Link>
                  )
                })}

                {/* HIỂN THỊ NÚT ĐĂNG TRUYỆN MỚI TRÊN MOBILE CHO RIÊNG ADMIN */}
                {isAdmin && (
                  <Link
                    href="/admin/new-story"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "rounded-xl px-3.5 py-2.5 text-xs font-bold transition-colors flex items-center justify-between mt-2 border border-amber-500/20",
                      pathname === '/admin/new-story'
                        ? "bg-amber-500/10 text-amber-800 dark:text-amber-400"
                        : "text-amber-800 dark:text-amber-400 hover:bg-secondary"
                    )}
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