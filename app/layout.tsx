import type { Metadata } from 'next'
import { Lora, Nunito } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { FavoritesProvider } from '@/components/favorites-provider'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const lora = Lora({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-lora',
  display: 'swap',
})

const nunito = Nunito({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-nunito',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Quán Truyện - Đọc truyện chữ bên tách cà phê',
  description:
    'Quán Truyện là góc đọc truyện chữ ấm áp: tiểu thuyết, ngôn tình, kiếm hiệp và những lưu ý từ chủ quán.',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="vi"
      className={`${lora.variable} ${nunito.variable} bg-background`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <FavoritesProvider>{children}</FavoritesProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
