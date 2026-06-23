import type { Metadata } from 'next'
import { Lora, Nunito } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { FavoritesProvider } from '@/components/favorites-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { ClerkProvider } from '@clerk/nextjs' // <-- Thêm dòng này
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
  title: '残星晓月',
  description: 'Chúc mọi người một ngày vui vẻ.',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider> {/* <-- Bọc thêm thẻ này ở ngoài cùng */}
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
    </ClerkProvider>
  )
}