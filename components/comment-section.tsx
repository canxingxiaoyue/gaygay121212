'use client'

import { useState } from 'react'
import { Star, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useApp } from '@/components/favorites-provider'
import { cn } from '@/lib/utils'

export function CommentSection({ storySlug }: { storySlug: string }) {
  const { comments, addComment, user, hydrated } = useApp()
  const [text, setText] = useState('')
  const [rating, setRating] = useState(5)
  const [hover, setHover] = useState(0)

  const storyComments = hydrated
    ? comments.filter((c) => c.storySlug === storySlug)
    : []

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    addComment({
      storySlug,
      user: user?.name ?? 'Khách',
      rating,
      text: text.trim(),
    })
    setText('')
    setRating(5)
  }

  return (
    <section className="flex flex-col gap-5">
      <h2 className="flex items-center gap-2 font-serif text-2xl font-bold">
        <MessageCircle className="size-5 text-primary" />
        Bình luận &amp; Đánh giá
        <span className="text-base font-normal text-muted-foreground">
          ({storyComments.length})
        </span>
      </h2>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Đánh giá của bạn:</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                aria-label={`${n} sao`}
              >
                <Star
                  className={cn(
                    'size-5 transition-colors',
                    (hover || rating) >= n
                      ? 'fill-accent text-accent'
                      : 'text-muted-foreground',
                  )}
                />
              </button>
            ))}
          </div>
        </div>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            user
              ? 'Chia sẻ cảm nhận của bạn về truyện này...'
              : 'Viết bình luận (bạn có thể đăng nhập để hiển thị tên của mình)...'
          }
          rows={3}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={!text.trim()}>
            Gửi bình luận
          </Button>
        </div>
      </form>

      <div className="flex flex-col gap-4">
        {storyComments.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
            Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ cảm nhận!
          </p>
        ) : (
          storyComments.map((c) => (
            <div
              key={c.id}
              className="flex gap-3 rounded-xl border border-border bg-card p-4"
            >
              <Avatar className="size-10 shrink-0">
                <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                  {c.user.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{c.user}</span>
                  <span className="text-xs text-muted-foreground">{c.date}</span>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={cn(
                        'size-3.5',
                        c.rating >= n
                          ? 'fill-accent text-accent'
                          : 'text-muted-foreground',
                      )}
                    />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {c.text}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
