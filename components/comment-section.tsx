'use client'

import { useState, useEffect } from 'react'
import { useUser, Show, SignInButton } from '@clerk/nextjs'
import { getComments, addComment, deleteComment } from '@/app/actions/comments'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Trash2, Loader2, Star, User as UserIcon, MessageSquare, CornerDownRight } from 'lucide-react'

// HÀM TỰ ĐỘNG NHẬN DIỆN VÀ TÔ ĐẬM MÀU NÂU NỔI BẬT CHO CÁC THẺ @TAG-TÊN
function renderContent(content: string) {
  if (!content) return ""
  const parts = content.split(/(@[^\s:]+)/g) // Tách các chữ có dấu @ ở đầu
  return parts.map((part, index) => {
    if (part.startsWith('@')) {
      return (
        <span key={index} className="text-amber-800 dark:text-amber-400 font-bold hover:underline cursor-pointer mr-1">
          {part}
        </span>
      )
    }
    return part
  })
}

export function CommentSection({ storySlug }: { storySlug: string }) {
  const { user, isSignedIn } = useUser()
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [rating, setRating] = useState(5)
  const [hover, setHover] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // Các state để xử lý phần PHẢN HỒI (REPLY)
  const [replyToId, setReplyToId] = useState<number | null>(null)
  const [replyContent, setReplyContent] = useState('')

  // 🌟 TỰ ĐỘNG NHẬN DIỆN QUYỀN ADMIN TRÊN CLIENT ĐỂ MỞ KHÓA NÚT XÓA [1.1.2]
  const isAdmin = !!(user?.id && user?.id === process.env.NEXT_PUBLIC_ADMIN_ID)

  async function loadComments() {
    const data = await getComments(storySlug)
    setComments(data)
  }

  useEffect(() => {
    if (storySlug) loadComments()
  }, [storySlug])

  // Gửi Đánh giá chính (Bình luận cha)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isSignedIn || !user || !newComment.trim()) return

    setIsLoading(true)
    const res = await addComment(
      storySlug,
      user.id,
      user.fullName || "Độc giả",
      user.imageUrl,
      newComment,
      rating
    )
    
    if (res.success) {
      setNewComment('')
      setRating(5)
      loadComments()
    } else {
      alert("Lỗi khi gửi đánh giá: " + res.error)
    }
    setIsLoading(false)
  }

  // Gửi Phản hồi (Bình luận con)
  async function handleReplySubmit(e: React.FormEvent, parentId: number) {
    e.preventDefault()
    if (!isSignedIn || !user || !replyContent.trim()) return

    setIsLoading(true)
    const res = await addComment(
      storySlug,
      user.id,
      user.fullName || "Độc giả",
      user.imageUrl,
      replyContent,
      5, // Phản hồi con mặc định không cần chấm sao
      parentId
    )
    
    if (res.success) {
      setReplyContent('')
      setReplyToId(null) // Đóng ô nhập phản hồi
      loadComments()
    } else {
      alert("Lỗi khi gửi phản hồi: " + res.error)
    }
    setIsLoading(false)
  }

  async function handleDelete(commentId: number) {
    if (!confirm("Bạn có chắc muốn xóa đánh giá này?")) return
    const res = await deleteComment(commentId)
    if (res.success) {
      loadComments()
    }
  }

  // Phân loại: Tách riêng Đánh giá gốc (cha) và Phản hồi (con)
  const parentComments = comments.filter(c => !c.parent_id).reverse() // Đảo ngược mảng để bình luận mới nhất lên đầu
  const getReplies = (parentId: number) => comments.filter(c => c.parent_id === parentId)

  return (
    <div className="mt-8 space-y-6 border-t border-stone-200 dark:border-stone-800/60 pt-8">
      {/* Nhúng font chữ tròn trịa cho nhãn Admin lấp lánh ở trang bình luận gốc [MỚI] */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@600;700&display=swap');
        .font-cute-comfortaa {
          font-family: 'Comfortaa', sans-serif !important;
        }
      `}} />

      <h3 className="text-xl font-bold font-serif text-stone-800 dark:text-stone-100">
        Đánh giá ({parentComments.length})
      </h3>

      {/* KHUNG GỬI ĐÁNH GIÁ GỐC */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Show when="signed-in">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-stone-600 dark:text-stone-400">Đánh giá của bạn:</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`size-6 ${
                      star <= (hover || rating) ? "fill-amber-400 text-amber-400" : "text-stone-300 dark:text-stone-700"
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs text-stone-400 dark:text-stone-500">({rating}/5 sao)</span>
          </div>
        </Show>

        <Textarea 
          placeholder={isSignedIn ? "Chia sẻ cảm nghĩ và đánh giá của bạn về truyện này..." : "Vui lòng đăng nhập để đánh giá"}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={!isSignedIn || isLoading}
          className="min-h-[100px] resize-none border-stone-200 dark:border-stone-850 bg-white dark:bg-[#1E1410] text-stone-800 dark:text-stone-100 focus-visible:ring-amber-500"
        />
        <div className="flex justify-end">
          <Show when="signed-in">
            <Button type="submit" disabled={isLoading || !newComment.trim()} className="bg-amber-700 hover:bg-amber-800 text-white">
              {isLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Gửi đánh giá
            </Button>
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button type="button" variant="outline" className="gap-2 rounded-full border-stone-200 dark:border-stone-850 hover:bg-stone-100 dark:hover:bg-stone-900">
                <UserIcon className="size-4 text-stone-600 dark:text-stone-400" />
                <span className="text-stone-700 dark:text-stone-300 font-medium">Đăng nhập để đánh giá</span>
              </Button>
            </SignInButton>
          </Show>
        </div>
      </form>

      {/* DANH SÁCH ĐÁNH GIÁ VÀ PHẢN HỒI */}
      <div className="space-y-6 mt-6">
        {parentComments.map((comment) => {
          // Kiểm tra xem người bình luận gốc này có phải Admin không [MỚI]
          const isCommentAuthorAdmin = comment.user_id && comment.user_id === process.env.NEXT_PUBLIC_ADMIN_ID

          return (
            <div key={comment.id} className="space-y-3">
              {/* Đánh giá gốc (Cha) */}
              <div className="flex gap-4 bg-white dark:bg-[#2C1F1A] p-5 rounded-xl shadow-sm border border-stone-100 dark:border-stone-800/40 relative group">
                <Avatar className="size-10 border border-stone-200 dark:border-stone-800">
                  <AvatarImage src={comment.user_avatar} />
                  <AvatarFallback>{comment.user_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 pr-8 flex-wrap">
                    <p className="font-bold text-sm text-stone-800 dark:text-stone-200">{comment.user_name}</p>
                    
                    {/* 🌟 ĐÃ SỬA: Xóa từ khóa animate-pulse để nhãn Admin hiển thị tĩnh lặng, tinh tế trên bình luận gốc [MỚI] */}
                    {isCommentAuthorAdmin && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-cute-comfortaa font-bold bg-gradient-to-r from-rose-100 to-amber-100 dark:from-rose-950/40 dark:to-stone-900 border border-rose-200/40 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.15)] dark:shadow-[0_0_15px_rgba(244,63,94,0.3)] scale-90 origin-left select-none">
                        ⋆. ˚࿔ Admin 𝜗𝜚˚⋆
                      </span>
                    )}

                    <div className="flex gap-0.5 ml-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`size-3.5 ${i < (comment.rating || 5) ? "fill-amber-400 text-amber-400" : "text-stone-300 dark:text-stone-700"}`} />
                      ))}
                    </div>
                    <span className="text-xs text-stone-400 dark:text-stone-500 ml-auto">
                      {new Date(comment.created_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <p className="text-stone-700 dark:text-stone-300 mt-2 whitespace-pre-wrap leading-relaxed text-sm">
                    {renderContent(comment.content)}
                  </p>

                  {/* NÚT PHẢN HỒI (REPLY) TRÊN BÌNH LUẬN CHA */}
                  {isSignedIn && (
                    <button 
                      onClick={() => {
                        setReplyToId(comment.id)
                        setReplyContent(`@${comment.user_name} `)
                      }}
                      className="mt-3 flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-400 font-semibold transition-colors"
                    >
                      <MessageSquare className="size-3.5" />
                      Phản hồi
                    </button>
                  )}
                </div>

                {/* 🌟 PHÂN QUYỀN MỞ KHÓA NÚT XÓA: Admin HOẶC chính chủ bình luận đều xóa được [1] */}
                {(isAdmin || user?.id === comment.user_id) && (
                  <button 
                    type="button"
                    onClick={() => handleDelete(comment.id)}
                    className="absolute top-4 right-4 text-red-500 dark:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md"
                    title="Xóa đánh giá"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>

              {/* DANH SÁCH CÁC PHẢN HỒI CON (Thụt lề sang phải và có đường kẻ dọc nối) */}
              <div className="ml-12 space-y-3 border-l-2 border-stone-200 dark:border-stone-850 pl-4">
                {getReplies(comment.id).map((reply) => {
                  // Kiểm tra xem người phản hồi này có phải Admin không [MỚI]
                  const isReplyAuthorAdmin = reply.user_id && reply.user_id === process.env.NEXT_PUBLIC_ADMIN_ID

                  return (
                    <div key={reply.id} className="flex gap-3 bg-stone-50/50 dark:bg-[#1F1512] p-4 rounded-xl border border-stone-100/50 dark:border-stone-800/30 relative group">
                      <Avatar className="size-8 border border-stone-200 dark:border-stone-800">
                        <AvatarImage src={reply.user_avatar} />
                        <AvatarFallback>{reply.user_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 pr-8 flex-wrap">
                          <p className="font-bold text-sm text-stone-800 dark:text-stone-200">{reply.user_name}</p>
                          
                          {/* 🌟 ĐÃ SỬA: Xóa từ khóa animate-pulse để nhãn Admin hiển thị tĩnh lặng, tinh tế trên phản hồi con [MỚI] */}
                          {isReplyAuthorAdmin && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-cute-comfortaa font-bold bg-gradient-to-r from-rose-100 to-amber-100 dark:from-rose-950/40 dark:to-stone-900 border border-rose-200/40 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.15)] dark:shadow-[0_0_15px_rgba(244,63,94,0.3)] scale-[0.85] origin-left select-none">
                              ⋆. ˚࿔ Admin 𝜗𝜚˚⋆
                            </span>
                          )}

                          <span className="text-[10px] text-stone-400 dark:text-stone-500 ml-auto">
                            {new Date(reply.created_at).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        <p className="text-stone-700 dark:text-stone-300 mt-1 whitespace-pre-wrap leading-relaxed text-sm">
                          {renderContent(reply.content)}
                        </p>

                        {/* NÚT PHẢN HỒI (REPLY) TRÊN BÌNH LUẬN CON */}
                        {isSignedIn && (
                          <button 
                            onClick={() => {
                              setReplyToId(comment.id) // Vẫn mở khung nhập ở cuối của bình luận cha này
                              setReplyContent(`@${reply.user_name} `) // Tự động điền @tên người gửi phản hồi trước đó!
                            }}
                            className="mt-2 flex items-center gap-1.5 text-[10px] text-stone-500 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-400 font-semibold transition-colors"
                          >
                            <MessageSquare className="size-3" />
                            Phản hồi
                          </button>
                        )}
                      </div>

                      {/* 🌟 PHÂN QUYỀN MỞ KHÓA NÚT XÓA PHẢN HỒI: Admin HOẶC chính chủ đều xóa được [1] */}
                      {(isAdmin || user?.id === reply.user_id) && (
                        <button 
                          type="button"
                          onClick={() => handleDelete(reply.id)}
                          className="absolute top-3 right-3 text-red-500 dark:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md"
                          title="Xóa phản hồi"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  )
                })}

                {/* KHUNG NHẬP PHẢN HỒI (Chỉ xuất hiện khi click nút Phản hồi) */}
                {replyToId === comment.id && (
                  <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="flex gap-2 mt-2 items-end">
                    <CornerDownRight className="size-5 text-stone-400 shrink-0 self-center" />
                    <Input 
                      placeholder="Viết câu trả lời của bạn..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="flex-1 text-sm h-9 border-stone-200 dark:border-stone-800 bg-white dark:bg-[#1E1410] text-stone-800 dark:text-stone-100 focus-visible:ring-amber-500"
                      autoFocus
                    />
                    <Button type="submit" size="sm" className="h-9 bg-amber-700 hover:bg-amber-800 text-white">Gửi</Button>
                    <Button type="button" variant="ghost" size="sm" className="h-9 dark:text-stone-300 dark:hover:bg-stone-800" onClick={() => setReplyToId(null)}>Hủy</Button>
                  </form>
                )}
              </div>
            </div>
          )
        })}

        {parentComments.length === 0 && (
          <p className="text-stone-500 dark:text-stone-400 text-center italic py-8 bg-stone-50 dark:bg-stone-900/50 rounded-xl border border-dashed border-stone-200 dark:border-stone-800">
            Chưa có đánh giá nào. Hãy là người đầu tiên!
          </p>
        )}
      </div>
    </div>
  )
}