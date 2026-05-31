import Link from 'next/link'
import { Coffee } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Coffee className="size-4" />
            </span>
            <span className="font-serif text-lg font-bold">Quán Truyện</span>
          </Link>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Góc đọc truyện chữ ấm áp, nơi mỗi câu chuyện được kể bên tách cà phê.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">
            Khám phá
          </h3>
          <Link href="/truyen" className="text-sm text-muted-foreground hover:text-foreground">
            Tủ truyện
          </Link>
          <Link href="/da-hoan-thanh" className="text-sm text-muted-foreground hover:text-foreground">
            Truyện đã hoàn thành
          </Link>
          <Link href="/yeu-thich" className="text-sm text-muted-foreground hover:text-foreground">
            Truyện yêu thích
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">
            Về quán
          </h3>
          <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">
            Blog của quán
          </Link>
          <Link href="/luu-y" className="text-sm text-muted-foreground hover:text-foreground">
            Lưu ý của chủ quán
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">
            Liên hệ
          </h3>
          <p className="text-sm text-muted-foreground">quantruyen@email.vn</p>
          <p className="text-sm text-muted-foreground">
            Cập nhật: Thứ 3, Thứ 5, Chủ Nhật
          </p>
        </div>
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Quán Truyện. Dữ liệu truyện chỉ mang tính minh
        họa.
      </div>
    </footer>
  )
}
