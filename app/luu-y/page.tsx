import { Coffee } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { OWNER_NOTES } from '@/lib/stories'

export default function NotesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Coffee className="size-7" />
          </span>
          <h1 className="font-serif text-3xl font-bold md:text-4xl">
            Lưu ý của chủ quán
          </h1>
          <p className="max-w-xl text-pretty text-muted-foreground">
            Một vài điều nhỏ chủ quán muốn gửi gắm tới các bạn độc giả thân mến.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {OWNER_NOTES.map((note, i) => (
            <div
              key={note.title}
              className="flex gap-4 rounded-xl border border-border bg-card p-5"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary font-serif text-lg font-bold text-secondary-foreground">
                {i + 1}
              </span>
              <div>
                <h2 className="font-serif text-lg font-bold">{note.title}</h2>
                <p className="mt-1 leading-relaxed text-muted-foreground">
                  {note.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-border bg-secondary p-6 text-center">
          <p className="font-serif text-lg italic text-secondary-foreground">
            &ldquo;Cảm ơn bạn đã ghé quán. Chúc bạn có những giờ phút đọc truyện
            thật ấm áp.&rdquo;
          </p>
          <p className="mt-2 text-sm font-semibold text-muted-foreground">
            — Chủ quán
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
