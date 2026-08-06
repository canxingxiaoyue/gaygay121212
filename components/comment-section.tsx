'use client'

import { useState, useEffect, useMemo } from 'react'
import { useUser, Show, SignInButton } from '@clerk/nextjs'
import { getComments, addComment, deleteComment, toggleCommentReaction, getCommentReactions } from '@/app/actions/comments'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Trash2, Loader2, Star, User as UserIcon, MessageSquare, CornerDownRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// 🌟 DANH SÁCH TOÀN BỘ 19 STICKER MÈO KLEIN TRONG THƯ MỤC PUBLIC/STICKERS
export const KLEIN_STICKERS = [
  { id: 'klein_blink', label: 'Lấp lánh', url: '/stickers/Kleinblink.jpg' },
  { id: 'klein_camon', label: 'Cảm ơn', url: '/stickers/Kleincamon.png' },
  { id: 'klein_camon2', label: 'Cảm ơn sếp', url: '/stickers/Kleincamon2.png' },
  { id: 'klein_canloi', label: 'Cạn lời', url: '/stickers/Kleincanloi.jpg' },
  { id: 'klein_chamhoi', label: 'Chấm hỏi', url: '/stickers/Kleinchamhoi.PNG' },
  { id: 'klein_ditu', label: 'Vào tù', url: '/stickers/Kleinditu.png' },
  { id: 'klein_khoc', label: 'Khóc', url: '/stickers/Kleinkhoc.png' },
  { id: 'klein_luoibieng', label: 'Lười biếng', url: '/stickers/Kleinluoibieng.jpg' },
  { id: 'klein_nungniu', label: 'Nũng nịu', url: '/stickers/Kleinnungniu.png' },
  { id: 'klein_nghingo', label: 'Nghi ngờ', url: '/stickers/Kleinnghingo.jpg' },
  { id: 'klein_oeoe', label: 'Ọe ọe', url: '/stickers/Kleinoeoe.png' },
  { id: 'klein_xinan', label: 'Xin ăn', url: '/stickers/Kleinxinan.jpg' },
  { id: 'klein_xoadau', label: 'Xoa đầu', url: '/stickers/Kleinxoadau.png' },
  { id: 'klein_xuathon', label: 'Xuất hồn', url: '/stickers/Kleinxuathon.png' },
  { id: 'klein_xulong', label: 'Xù lông', url: '/stickers/Kleinxulong.png' },
  { id: 'klein_gaothet', label: 'Gào thét', url: '/stickers/Kleingaothet.jpg' },
  { id: 'klein_ghichep', label: 'Ghi chép', url: '/stickers/Kleinghichep.jpg' },
  { id: 'klein_gomo', label: 'Gõ mõ', url: '/stickers/Kleingomo.jpg' },
  { id: 'klein_hoahong', label: 'Hoa hồng', url: '/stickers/Kleinhoahong.jpg' },
] as const

// HÀM TỰ ĐỘNG NHẬN DIỆN VÀ TÔ ĐẬM MÀU NÂU NỔI BẬT CHO CÁC THẺ @TAG-TÊN
function renderContent(content: string) {
  if (!content) return ""
  const parts = content.split(/(@[^\s:]+)/g)
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

  // Các state xử lý PHẢN HỒI (REPLY)
  const [replyToId, setReplyToId] = useState<number | null>(null)
  const [replyContent, setReplyContent] = useState('')

  // STATE QUẢN LÝ TÍNH NĂNG THẢ STICKER KLEIN
  const [activePickerCommentId, setActivePickerCommentId] = useState<number | null>(null)
  const [reactions, setReactions] = useState<Record<number, Record<string, { count: number; userReacted: boolean }>>>({})

  // TỰ ĐỘNG NHẬN DIỆN QUYỀN ADMIN TRÊN CLIENT
  const isAdmin = !!(user?.id && user?.id === process.env.NEXT_PUBLIC_ADMIN_ID)

  async function loadComments() {
    const data = await getComments(storySlug)
    setComments(data)

    if (data && data.length > 0) {
      const commentIds = data.map((c: any) => c.id)
      const reactionsData = await getCommentReactions(commentIds)
      setReactions(reactionsData)
    }
  }

  useEffect(() => {
    if (storySlug) loadComments()
  }, [storySlug])

  // 1. PHÂN LOẠI CÁC BÀI ĐÁNH GIÁ GỐC (CHA) VÀ PHẢN HỒI CON (REPLIES)
  const allParentRatings = useMemo(() => {
    return comments.filter(c => !c.parent_id)
  }, [comments])

  const parentComments = useMemo(() => {
    return allParentRatings.filter(c => 
      c.content && 
      c.content !== "||EMPTY_COMMENT||" && 
      c.content.trim() !== ""
    ).reverse()
  }, [allParentRatings])

  const getReplies = (parentId: number) => comments.filter(c => c.parent_id === parentId)

  // 2. THUẬT TOÁN TÍNH TOÁN ĐỘNG TOÀN BỘ CHỈ SỐ THỐNG KÊ
  const totalRatingsCount = allParentRatings.length

  const averageRating = useMemo(() => {
    if (totalRatingsCount === 0) return "0.0"
    const totalSum = allParentRatings.reduce((sum, c) => sum + (c.rating || 5), 0)
    return (totalSum / totalRatingsCount).toFixed(1)
  }, [allParentRatings, totalRatingsCount])

  const starDistribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0]
    allParentRatings.forEach(c => {
      const r = c.rating || 5
      if (r >= 1 && r <= 5) counts[r]++
    })

    const distribution = []
    for (let star = 5; star >= 1; star--) {
      const count = counts[star]
      const percent = totalRatingsCount > 0 ? Math.round((count / totalRatingsCount) * 100) : 0
      distribution.push({ star, count, percent })
    }
    return distribution
  }, [allParentRatings, totalRatingsCount])

  // 3. KIỂM TRA XEM NGƯỜI DÙNG HIỆN TẠI ĐÃ GỬI ĐÁNH GIÁ CHƯA
  const userRatingRow = useMemo(() => {
    if (!isSignedIn || !user) return null
    return allParentRatings.find(c => c.user_id === user.id)
  }, [allParentRatings, isSignedIn, user])

  const hasRated = !!userRatingRow

  // Gửi Đánh giá chính
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isSignedIn || !user) return

    setIsLoading(true)
    const contentToSend = newComment.trim() || "||EMPTY_COMMENT||"

    const res = await addComment(
      storySlug,
      user.id,
      user.fullName || "Độc giả",
      user.imageUrl,
      contentToSend,
      rating
    )
    
    if (res.success) {
      alert("💖 Cảm ơn bạn đã để lại dấu chân (≧ヮếm) 💕")
      setNewComment('')
      setRating(5)
      loadComments()
    } else {
      alert("Lỗi khi gửi đánh giá: " + res.error)
    }
    setIsLoading(false)
  }

  // Khởi tạo luồng chỉnh sửa đánh giá
  async function handleEditOwnReview() {
    if (!userRatingRow) return
    if (!confirm("Bạn có chắc chắn muốn chỉnh sửa lại dấu chân cũ không?\n(Hệ thống sẽ dọn dẹp dấu chân cũ để bạn gieo dấu chân mới).")) return

    const prevRating = userRatingRow.rating || 5
    const prevContent = userRatingRow.content === "||EMPTY_COMMENT||" ? "" : userRatingRow.content

    setIsLoading(true)
    const res = await deleteComment(userRatingRow.id)
    if (res.success) {
      setRating(prevRating)
      setNewComment(prevContent)
      await loadComments()
    } else {
      alert("Lỗi khi tải bản chỉnh sửa: " + res.error)
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
      5,
      parentId
    )
    
    if (res.success) {
      setReplyContent('')
      setReplyToId(null)
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

  // HÀM XỬ LÝ THẢ / BỎ THẢ STICKER KLEIN
  const handleReactSticker = async (commentId: number, stickerId: string) => {
    if (!isSignedIn) {
      alert('Vui lòng đăng nhập để thả dấu chân Mèo Klein!')
      return
    }

    setReactions((prev) => {
      const commentReactions = prev[commentId] || {}
      const currentSticker = commentReactions[stickerId] || { count: 0, userReacted: false }
      const isReacted = currentSticker.userReacted

      const newCount = isReacted ? Math.max(0, currentSticker.count - 1) : currentSticker.count + 1
      const newReacted = !isReacted

      return {
        ...prev,
        [commentId]: {
          ...commentReactions,
          [stickerId]: { count: newCount, userReacted: newReacted }
        }
      }
    })

    setActivePickerCommentId(null)

    const res = await toggleCommentReaction(commentId, stickerId)
    if (!res.success) {
      alert(res.error)
      loadComments()
    }
  }

  return (
    <div className="mt-8 space-y-6 border-t border-stone-200 dark:border-stone-800/60 pt-8 font-cute-quicksand">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@600;700&family=Quicksand:wght@500;600;700&display=swap');
        .font-cute-comfortaa {
          font-family: 'Comfortaa', sans-serif !important;
        }
        .font-cute-quicksand {
          font-family: 'Quicksand', sans-serif !important;
        }
      `}} />

      {/* KHỐI THỐNG KÊ CHI TIẾT ĐỘNG */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-[#F9F6F0] dark:bg-[#251B17] p-6 rounded-[22px] border border-[#E9DCC9] dark:border-[#3A2D27] shadow-sm animate-fade-in">
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center pb-6 md:pb-0 md:pr-6 gap-1.5 select-none">
          <span className="text-[11px] font-bold text-[#8C6D58] dark:text-stone-400 uppercase tracking-widest flex items-center gap-1.5">
            🐾 Dấu chân của các mèo nhỏ
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-4xl font-serif font-black text-[#5C3D2E] dark:text-[#EADBC8] leading-none">{averageRating}</span>
            <span className="text-[#8C6D58] dark:text-stone-500 text-xs font-semibold">/ 5.0</span>
          </div>
          
          <div className="flex gap-0.5 my-1">
            {Array.from({ length: 5 }).map((_, i) => {
              const starValue = i + 1;
              const avgNum = parseFloat(averageRating);
              const isFilled = starValue <= Math.round(avgNum);
              return (
                <Star 
                  key={i} 
                  className={cn(
                    "size-4", 
                    isFilled ? "fill-amber-400 text-amber-400" : "text-stone-300 dark:text-stone-700"
                  )} 
                />
              )
            })}
          </div>
          <p className="text-[10px] text-stone-400 dark:text-stone-500 font-semibold mt-1">
            👣 {totalRatingsCount.toLocaleString('vi-VN')} lượt để lại dấu chân
          </p>

          {hasRated && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FAF3EB] border border-[#DECAC0]/60 dark:bg-[#342621] dark:border-[#4E3931] text-[#7A4F37] dark:text-[#D2A078] text-[10px] font-bold animate-fade-in shadow-sm">
              <span>🐾 Bạn đã để lại dấu chân {userRatingRow.rating}★</span>
            </div>
          )}
        </div>

        <div className="md:col-span-8 flex flex-col justify-center gap-2.5">
          {starDistribution.map(({ star, count, percent }) => (
            <div key={star} className="flex items-center gap-3 text-xs">
              <span className="w-10 text-right font-semibold text-stone-500 dark:text-stone-400 flex items-center justify-end gap-0.5 shrink-0 select-none">
                {star} <Star className="size-3 fill-stone-400 text-stone-400" />
              </span>

              <div className="flex-1 h-2 bg-[#EADBCE]/40 dark:bg-[#1A110E] rounded-full overflow-hidden relative shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-[#D2A078] to-[#B87C4C] dark:from-[#A06C4C] dark:to-[#8B5E3C] rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${percent}%` }}
                />
              </div>

              <span className="w-16 text-left font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5 shrink-0 select-none">
                <span>{percent}%</span>
                <span className="text-[10px] text-stone-400 font-normal">({count})</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* FORM ĐÁNH GIÁ */}
      {hasRated ? (
        <div className="bg-[#FAF3EB] dark:bg-[#251B17] p-5 rounded-2xl border border-[#DECAC0]/60 dark:border-[#4A3228]/50 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in shadow-sm">
          <div className="flex items-start gap-1 text-left">
            <div>
              <p className="text-sm font-bold text-[#5C3D2E] dark:text-[#efebe9] leading-snug">
                Cảm ơn bạn đã để lại dấu chân (≧ヮếm) 💕
              </p>
              <p className="text-xs text-[#8C6D58] dark:text-stone-400 mt-1">
                Bạn đã chấm <span className="font-bold text-amber-700 dark:text-amber-400">{userRatingRow.rating}★</span> cho bộ truyện này vào ngày {new Date(userRatingRow.created_at).toLocaleDateString('vi-VN')}.{userRatingRow.content !== "||EMPTY_COMMENT||" && " Cảm ơn vì lời meow dễ thương của bạn ♡"}
              </p>
            </div>
          </div>
          
          <Button
            type="button"
            onClick={handleEditOwnReview}
            disabled={isLoading}
            variant="outline"
            className="rounded-full border-[#DECAC0] dark:border-[#4A3228] bg-transparent text-[#5C3D2E] dark:text-[#efebe9] hover:bg-[#EADBCE]/50 dark:hover:bg-[#3A2D27] h-9 px-4.5 text-xs font-semibold shrink-0 transition-all duration-200 active:scale-95"
          >
            {isLoading ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : "🐾 Sửa dấu chân"}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 animate-fade-in">
          <Show when="signed-in">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-stone-600 dark:text-stone-400">Đánh giá của bạn:</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHover(star)}
                      onMouseLeave={() => setHover(0)}
                      className="p-0.5 transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        className={`size-6 ${
                          star <= (hover || rating) ? "fill-amber-400 text-amber-400" : "text-stone-300 dark:text-stone-700"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs text-stone-400 dark:text-stone-500 font-semibold">( {rating}/5 sao )</span>
              </div>
              <span className="text-[10px] text-[#8C6D58] dark:text-stone-400 italic">🐾 Mỗi lượt đánh giá là một dấu chân nhỏ dành cho bộ truyện này.</span>
            </div>
          </Show>

          <Textarea 
            placeholder={isSignedIn ? "Chia sẻ thêm cảm nghĩ của bạn về truyện này (Không bắt buộc)..." : "Vui lòng đăng nhập để đánh giá"}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={!isSignedIn || isLoading}
            className="min-h-[100px] resize-none border-stone-200 dark:border-stone-850 bg-white dark:bg-[#1E1410] text-stone-800 dark:text-stone-100 focus-visible:ring-amber-500"
          />
          <div className="flex justify-end">
            <Show when="signed-in">
              <Button type="submit" disabled={isLoading} className="bg-[#5C3D2E] hover:bg-[#4A2E22] text-[#FBF9F6] rounded-full px-5 py-2 text-xs font-bold transition-all duration-200 active:scale-95">
                {isLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Gửi đánh giá
              </Button>
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button type="button" variant="outline" className="gap-2 rounded-full border-stone-200 dark:border-stone-850 hover:bg-stone-100 dark:hover:bg-stone-900 h-10 px-5 text-xs">
                  <UserIcon className="size-4 text-stone-600 dark:text-stone-400" />
                  <span className="text-stone-700 dark:text-stone-300 font-medium">Đăng nhập để đánh giá</span>
                </Button>
              </SignInButton>
            </Show>
          </div>
        </form>
      )}

      {/* DANH SÁCH ĐÁNH GIÁ VÀ PHẢN HỒI */}
      <div className="space-y-6 mt-6">
        <h3 className="text-base font-bold font-serif text-[#5C3D2E] dark:text-[#efebe9] leading-tight flex items-center gap-1.5">
          <span>🌸</span> Góc cảm nhận từ các mèo nhỏ ({parentComments.length})
        </h3>

        {parentComments.map((comment) => {
          const isCommentAuthorAdmin = comment.user_id && comment.user_id === process.env.NEXT_PUBLIC_ADMIN_ID
          const commentReactions = reactions[comment.id] || {}

          return (
            <div key={comment.id} className="space-y-3">
              <div className="flex gap-4 bg-white dark:bg-[#2C1F1A] p-5 rounded-xl shadow-sm border border-stone-100 dark:border-stone-800/40 relative group animate-fade-in">
                <Avatar className="size-10 border border-stone-200 dark:border-stone-800">
                  <AvatarImage src={comment.user_avatar} />
                  <AvatarFallback>{comment.user_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 pr-8 flex-wrap">
                    <p className="font-bold text-sm text-stone-800 dark:text-stone-200">{comment.user_name}</p>
                    
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

                  {comment.content && comment.content !== "||EMPTY_COMMENT||" ? (
                    <p className="text-stone-750 dark:text-stone-300 mt-2 whitespace-pre-wrap leading-relaxed text-sm">
                      {renderContent(comment.content)}
                    </p>
                  ) : (
                    <p className="text-stone-400 dark:text-stone-500 mt-2 text-xs italic select-none">
                      (Độc giả chỉ đánh giá sao)
                    </p>
                  )}

                  {/* 🌟 HÀNG NÚT TÁC VỤ: DÁN CHUẨN THẺ <span>🐾 Thả dấu chân</span> */}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold text-stone-500 pt-1">
                    {isSignedIn && (
                      <button 
                        onClick={() => {
                          setReplyToId(comment.id)
                          setReplyContent(`@${comment.user_name} `)
                        }}
                        className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-400 font-semibold transition-colors"
                      >
                        <MessageSquare className="size-3.5" />
                        Phản hồi
                      </button>
                    )}

                    {isSignedIn && <span>•</span>}

                    {/* NÚT THẢ DẤU CHÂN */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setActivePickerCommentId(activePickerCommentId === comment.id ? null : comment.id)}
                        className="hover:text-amber-700 dark:hover:text-amber-400 transition-colors flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400 font-semibold"
                      >
                        <span>🐾 Thả dấu chân</span>
                      </button>

                      {/* POPUP BẢNG CHỌN 19 STICKER KLEIN */}
                      {activePickerCommentId === comment.id && (
                        <div className="absolute left-0 bottom-full mb-2 z-[99999] w-[280px] sm:w-[330px] p-3.5 rounded-[22px] border-2 border-[#D89A52] bg-[#FAF3EB] dark:bg-[#1E1410] shadow-[0_12px_35px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in-95 duration-200 font-sans">
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#EADBC8] dark:border-stone-800">
                            <span className="text-[11px] font-extrabold text-[#7A4F37] dark:text-[#F4C27A] uppercase tracking-wider flex items-center gap-1">
                              <span>🐾</span> Thả dấu chân Mèo Klein
                            </span>
                            <button
                              type="button"
                              onClick={() => setActivePickerCommentId(null)}
                              className="text-stone-400 hover:text-stone-600 rounded-full p-0.5"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-5 gap-2 max-h-52 overflow-y-auto pr-1">
                            {KLEIN_STICKERS.map((st) => (
                              <button
                                key={st.id}
                                type="button"
                                onClick={() => handleReactSticker(comment.id, st.id)}
                                className="p-1.5 rounded-xl hover:bg-[#FFF4E7] dark:hover:bg-[#3D2D23] transition-all hover:scale-110 active:scale-90 flex flex-col items-center justify-center group"
                                title={st.label}
                              >
                                <img src={st.url} alt={st.label} className="size-10 object-contain select-none" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* HIỂN THỊ CÁC DẤU CHÂN ĐÃ THẢ */}
                    <div className="flex flex-wrap items-center gap-1.5 ml-2">
                      {Object.entries(commentReactions).map(([sId, data]) => {
                        if (data.count <= 0) return null
                        const stickerObj = KLEIN_STICKERS.find(s => s.id === sId)
                        if (!stickerObj) return null

                        return (
                          <button
                            key={sId}
                            type="button"
                            onClick={() => handleReactSticker(comment.id, sId)}
                            className={cn(
                              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all active:scale-95",
                              data.userReacted
                                ? "bg-[#FFF4E7] dark:bg-[#3D2D23] border-[#D89A52] text-[#A45C12] dark:text-[#F4C27A] shadow-2xs"
                                : "bg-stone-50 dark:bg-[#1A1615] border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:border-[#D89A52]"
                            )}
                            title={`${data.count} người đã thả dấu chân ${stickerObj.label}`}
                          >
                            <img src={stickerObj.url} alt={stickerObj.label} className="size-4.5 object-contain" />
                            <span>{data.count}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

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

              {/* DANH SÁCH CÁC PHẢN HỒI CON (REPLIES) */}
              <div className="ml-12 space-y-3 border-l-2 border-stone-200 dark:border-stone-850 pl-4">
                {getReplies(comment.id).map((reply) => {
                  const isReplyAuthorAdmin = reply.user_id && reply.user_id === process.env.NEXT_PUBLIC_ADMIN_ID
                  const replyReactions = reactions[reply.id] || {}

                  return (
                    <div key={reply.id} className="flex gap-3 bg-stone-50/50 dark:bg-[#1F1512] p-4 rounded-xl border border-stone-100/50 dark:border-stone-800/30 relative group">
                      <Avatar className="size-8 border border-stone-200 dark:border-stone-800">
                        <AvatarImage src={reply.user_avatar} />
                        <AvatarFallback>{reply.user_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 pr-8 flex-wrap">
                          <p className="font-bold text-sm text-stone-800 dark:text-stone-200">{reply.user_name}</p>
                          
                          {isReplyAuthorAdmin && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-cute-comfortaa font-bold bg-gradient-to-r from-rose-100 to-amber-100 dark:from-rose-950/40 dark:to-stone-900 border border-rose-200/40 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.15)] dark:shadow-[0_0_15px_rgba(244,63,94,0.3)] scale-[0.85] origin-left select-none">
                              ⋆. ˚࿔ Admin 𝜗𝜚˚⋆
                            </span>
                          )}

                          <span className="text-[10px] text-stone-400 dark:text-stone-500 ml-auto">
                            {new Date(reply.created_at).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        <p className="text-stone-750 dark:text-stone-300 mt-1 whitespace-pre-wrap leading-relaxed text-sm">
                          {renderContent(reply.content)}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] font-semibold text-stone-500">
                          {isSignedIn && (
                            <button 
                              onClick={() => {
                                setReplyToId(comment.id)
                                setReplyContent(`@${reply.user_name} `)
                              }}
                              className="flex items-center gap-1 text-stone-500 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
                            >
                              <MessageSquare className="size-3" />
                              Phản hồi
                            </button>
                          )}

                          {isSignedIn && <span>•</span>}

                          {/* NÚT THẢ DẤU CHÂN TRÊN PHẢN HỒI CON */}
                          {isSignedIn && (
                            <div className="relative inline-block">
                              <button
                                type="button"
                                onClick={() => setActivePickerCommentId(activePickerCommentId === reply.id ? null : reply.id)}
                                className="hover:text-amber-700 dark:hover:text-amber-400 transition-colors flex items-center gap-1 text-stone-500 dark:text-stone-400 font-semibold"
                              >
                                <span>🐾 Thả dấu chân</span>
                              </button>

                              {activePickerCommentId === reply.id && (
                                <div className="absolute left-0 bottom-full mb-2 z-[99999] w-[260px] sm:w-[300px] p-3.5 rounded-[22px] border-2 border-[#D89A52] bg-[#FAF3EB] dark:bg-[#1E1410] shadow-[0_12px_35px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in-95 duration-200 font-sans">
                                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#EADBC8] dark:border-stone-800">
                                    <span className="text-[11px] font-extrabold text-[#7A4F37] dark:text-[#F4C27A] uppercase tracking-wider flex items-center gap-1">
                                      <span>🐾</span> Thả dấu chân Mèo Klein
                                    </span>
                                    <button type="button" onClick={() => setActivePickerCommentId(null)} className="text-stone-400 hover:text-stone-600 rounded-full p-0.5">
                                      <X className="size-3.5" />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-5 gap-1.5 max-h-44 overflow-y-auto pr-1">
                                    {KLEIN_STICKERS.map((st) => (
                                      <button
                                        key={st.id}
                                        type="button"
                                        onClick={() => handleReactSticker(reply.id, st.id)}
                                        className="p-1 rounded-xl hover:bg-[#FFF4E7] dark:hover:bg-[#3D2D23] transition-all hover:scale-110 active:scale-90 flex items-center justify-center"
                                        title={st.label}
                                      >
                                        <img src={st.url} alt={st.label} className="size-8 object-contain" />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {(isAdmin || (isSignedIn && user?.id === rCommentUserId)) && (
                            <>
                              <button onClick={() => handleStartCommentEdit(reply.id, rTextPart)} className="hover:text-stone-800 transition-colors">Sửa</button>
                              <button onClick={() => handleDeleteComment(reply.id)} className="hover:text-red-600 transition-colors">Xóa</button>
                            </>
                          )}

                          {/* BADGES DẤU CHÂN TRÊN PHẢN HỒI CON */}
                          <div className="inline-flex items-center gap-1 ml-1">
                            {Object.entries(replyReactions).map(([sId, data]) => {
                              if (data.count <= 0) return null
                              const stickerObj = KLEIN_STICKERS.find(s => s.id === sId)
                              if (!stickerObj) return null

                              return (
                                <button
                                  key={sId}
                                  type="button"
                                  onClick={() => handleReactSticker(reply.id, sId)}
                                  className={cn(
                                    "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold border transition-all active:scale-95",
                                    data.userReacted
                                      ? "bg-[#FFF4E7] dark:bg-[#3D2D23] border-[#D89A52] text-[#A45C12] dark:text-[#F4C27A]"
                                      : "bg-stone-50 dark:bg-[#1A1615] border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400"
                                  )}
                                  title={`${data.count} người đã thả dấu chân ${stickerObj.label}`}
                                >
                                  <img src={stickerObj.url} alt={stickerObj.label} className="size-3.5 object-contain" />
                                  <span>{data.count}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      {(isAdmin || user?.id === rCommentUserId) && (
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
                    <Button type="submit" size="sm" className="h-9 bg-[#5C3D2E] hover:bg-[#4A2E22] text-[#FBF9F6]">Gửi</Button>
                    <Button type="button" variant="ghost" size="sm" className="h-9 dark:text-stone-300 dark:hover:bg-stone-850" onClick={() => setReplyToId(null)}>Hủy</Button>
                  </form>
                )}
              </div>
            </div>
          )
        })}

        {parentComments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-stone-400 dark:text-stone-600 space-y-3 bg-[#F9F6F0] dark:bg-[#251B17] rounded-2xl border border-dashed border-[#E9DCC9] dark:border-[#3A2D27] p-6 animate-fade-in select-none">
            <div className="text-3xl opacity-55 animate-bounce duration-1000">ᓚ₍⑅^..^₎♡</div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-stone-500 dark:text-stone-400">
                🐾 Chưa có mèo nhỏ nào để lại lời meow cả...
              </p>
              <p className="text-[11px] text-stone-400 dark:text-stone-500 italic">
                Hãy là người đầu tiên ghé qua và để lại chút yêu thương nhé!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}