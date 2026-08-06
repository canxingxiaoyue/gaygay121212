'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { SignInButton } from '@clerk/nextjs'
import { Loader2, X, Image as ImageIcon, MessageSquare } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { KLEIN_STICKERS } from '@/components/comment-section'
import { toggleCommentReaction, getCommentReactions } from '@/app/actions/comments'

interface ParagraphCommentsProps {
  paraCommentOpen: boolean
  setParaCommentOpen: (open: boolean) => void
  activeParaText: string
  sortedStickers: any[]
  paraComments: any[]
  userReactions: string[]
  textComments: any[]
  isLoadingComments: boolean
  isSending: boolean
  isUploadingCommentImg: boolean
  commentText: string
  setCommentText: (text: string) => void
  commentImgUrl: string
  setCommentImgUrl: (url: string) => void
  commentFileInputRef: React.RefObject<HTMLInputElement | null>
  handleCommentImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleStickerClick: (id: string) => void
  handleSendParaComment: () => void
  editingCommentId: number | null
  editingCommentText: string
  setEditingCommentText: (text: string) => void
  handleStartCommentEdit: (id: number, text: string) => void
  handleSaveCommentEdit: (id: number) => void
  handleDeleteComment: (id: number) => void
  setEditingCommentId: (id: number | null) => void
  isSignedIn: boolean
  user: any
  isAdmin: boolean
  POPUP_THEME_MAPPING: any
  readerTheme: string
  replyingToId: number | null
  setReplyingToId: (id: number | null) => void
  replyText: string
  setReplyText: (text: string) => void
  handleSendReply: (parentId: number) => void
  expandedCommentIds: number[]
  toggleExpanded: (id: number) => void
}

export function ParagraphComments({
  paraCommentOpen,
  setParaCommentOpen,
  activeParaText,
  sortedStickers,
  paraComments,
  userReactions,
  textComments,
  isLoadingComments,
  isSending,
  isUploadingCommentImg,
  commentText,
  setCommentText,
  commentImgUrl,
  setCommentImgUrl,
  commentFileInputRef,
  handleCommentImageUpload,
  handleStickerClick,
  handleSendParaComment,
  editingCommentId,
  editingCommentText,
  setEditingCommentText,
  handleStartCommentEdit,
  handleSaveCommentEdit,
  handleDeleteComment,
  setEditingCommentId,
  isSignedIn,
  user,
  isAdmin,
  POPUP_THEME_MAPPING,
  readerTheme,
  replyingToId,
  setReplyingToId,
  replyText,
  setReplyText,
  handleSendReply,
  expandedCommentIds,
  toggleExpanded,
}: ParagraphCommentsProps) {

  // STATE QUẢN LÝ TÍNH NĂNG THẢ STICKER KLEIN CHO CÁC BÌNH LUẬN TRONG MODAL
  const [activePickerCommentId, setActivePickerCommentId] = useState<number | null>(null)
  const [reactions, setReactions] = useState<Record<number, Record<string, { count: number; userReacted: boolean }>>>({})

  // NẠP CÁC LƯỢT THẢ STICKER KLEIN
  useEffect(() => {
    async function loadReactions() {
      if (textComments && textComments.length > 0) {
        const commentIds = textComments.map((c: any) => c.id).filter(Boolean)
        const reactionsData = await getCommentReactions(commentIds)
        setReactions(reactionsData)
      }
    }
    loadReactions()
  }, [textComments])

  // HÀM XỬ LÝ THẢ / BỎ THẢ STICKER MÈO KLEIN
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
    }
  }

  // LỌC LẤY BÌNH LUẬN GỐC
  const rootComments = textComments.filter(c => !c.content?.includes('||PARENT_ID||:'))

  // Hàm nạp các phản hồi con
  const getReplies = (parentId: number) => {
    return textComments.filter(c => c.content?.includes(`||PARENT_ID||:${parentId}`))
  }

  // Hàm xử lý khi bấm phản hồi
  const handleReplyClick = (id: number, userName: string) => {
    if (replyingToId === id) {
      setReplyingToId(null)
      setReplyText('')
    } else {
      setReplyingToId(id)
      setReplyText(`@${userName} `)
    }
  }

  return (
    paraCommentOpen && (
      <div
        onClick={() => setParaCommentOpen(false)}
        className="fixed inset-0 z-[9999]"
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-xs duration-200" />

        <div
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "relative w-full max-w-lg rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 border left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[10000]",
            POPUP_THEME_MAPPING[readerTheme]?.container
          )}
        >
          <style dangerouslySetInnerHTML={{ __html: `
            @import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@600;700&display=swap');
            .font-cute-comfortaa {
              font-family: 'Comfortaa', sans-serif !important;
            }
          `}} />

          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <img src="/klein.png" alt="Klein" className="w-7 h-5.5 object-contain dark:brightness-125 dark:drop-shadow-[0_0_2px_rgba(255,255,255,0.3)]" />
              <span className="font-serif font-bold text-base">₍^ &gt;⩊&lt; ^₎Ⳋ Gửi lời meo meo vào đây</span>
            </div>
            <button
              onClick={() => setParaCommentOpen(false)}
              className={cn("transition-colors rounded p-1", POPUP_THEME_MAPPING[readerTheme]?.close)}
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Trích dẫn đoạn văn */}
          <div className={cn("p-3.5 rounded-2xl text-xs italic line-clamp-3 leading-relaxed border mb-4 mt-2", POPUP_THEME_MAPPING[readerTheme]?.quote)}>
            &ldquo;{activeParaText}&rdquo;
          </div>

         {/* Bày tỏ cảm xúc dạng nhãn dán Klein xếp lưới */}
          <div className="text-center space-y-2 mb-4">
            <span
              className={cn(
                "block text-center text-[11px] italic tracking-widest transition-colors duration-300",
                POPUP_THEME_MAPPING[readerTheme]?.footprintText
              )}
            >
              ⋆｡˚☾ Dấu chân dưới trăng .✦ ݁˖
            </span>
           <div className={cn("grid grid-cols-5 sm:grid-cols-6 gap-2 p-2.5 rounded-3xl border max-h-28 sm:max-h-32 overflow-y-auto justify-items-center w-full shadow-inner", POPUP_THEME_MAPPING[readerTheme]?.reactionBg)}>
              {sortedStickers.map((sticker) => {
                const count = paraComments.filter(c => c.reaction === sticker.id).length
                const isSelected = userReactions.includes(sticker.id)
                const displayCount = count

                return (
                  <button
                    key={sticker.id}
                    type="button"
                    onClick={() => handleStickerClick(sticker.id)}
                    className={cn(
                      "flex flex-col items-center justify-between p-1.5 border transition-all duration-200 hover:scale-105 rounded-xl w-14 h-16 relative select-none",
                      isSelected ? POPUP_THEME_MAPPING[readerTheme]?.activeEmoji : "bg-[#FFFDFB] dark:bg-stone-900 border-stone-200/40 dark:border-stone-800"
                    )}
                    title={sticker.label}
                  >
                    <div className="w-10 h-10 flex items-center justify-center">
                      <img src={`/stickers/${sticker.file}`} alt={sticker.label} className="w-full h-full object-contain rounded-md" />
                    </div>
                    {displayCount > 0 && (
                      <span className={cn("text-[9px] font-bold px-1 py-0.5 rounded-full border leading-none scale-90", isSelected ? POPUP_THEME_MAPPING[readerTheme]?.activeBadge : POPUP_THEME_MAPPING[readerTheme]?.inactiveBadge)}>
                        {displayCount}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* DANH SÁCH BÌNH LUẬN KHUNG CUỘN */}
          <div className="flex-1 overflow-y-auto space-y-3.5 py-2 pr-1 min-h-[100px]">
            {isLoadingComments ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Loader2 className="size-5 animate-spin text-[#8B5E3C] dark:text-[#EADBC8]" />
                <span className="text-xs text-stone-400">Đang tải bình luận đoạn...</span>
              </div>
            ) : rootComments.length > 0 ? (
              rootComments.map((comm) => {
                const idParts = (comm.sender_name || '').split(' ||USER_ID||:')
                const rawName = idParts[0] || 'Ẩn danh'
                const restParts = idParts[1] || ''
                const avatarParts = restParts.split(' ||AVATAR_URL||:')
                const commentUserId = avatarParts[0] || ''
                const displayAvatar = avatarParts[1] || ''

                const contentParts = (comm.content || '').split(' ||IMAGE_URL||:')
                const textPart = contentParts[0]
                const imgPart = contentParts[1]

                const isCommenterAdmin = commentUserId && commentUserId === process.env.NEXT_PUBLIC_ADMIN_ID
                const replies = getReplies(comm.id)
                const isExpanded = expandedCommentIds.includes(comm.id)

                return (
                  <div key={comm.id} className="flex gap-2.5 items-start text-xs border-b border-stone-150/40 dark:border-stone-850/30 pb-4">
                    {displayAvatar ? (
                      <img src={displayAvatar} alt={rawName} className="size-7 rounded-full object-cover shrink-0 border border-stone-200 dark:border-stone-700 shadow-sm" />
                    ) : (
                      <div className={cn("flex h-7 w-7 items-center justify-center rounded-full font-bold shrink-0 text-xs border border-stone-200/20", POPUP_THEME_MAPPING[readerTheme]?.fallback)}>
                        {rawName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    <div className="flex-1 space-y-1 text-left">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-stone-800 dark:text-stone-200">{rawName}</span>
                          
                          {isCommenterAdmin && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-cute-comfortaa font-bold bg-gradient-to-r from-rose-100 to-amber-100 dark:from-rose-950/40 dark:to-stone-900 border border-rose-200/40 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.15)] dark:shadow-[0_0_15px_rgba(244,63,94,0.3)] scale-90 origin-left select-none">
                              ⋆. ˚࿔ Admin 𝜗𝜚˚⋆
                            </span>
                          )}

                          {comm.reaction && (
                            (() => {
                              const sticker = sortedStickers.find(s => s.id === comm.reaction)
                              if (sticker) {
                                return <img src={`/stickers/${sticker.file}`} alt={sticker.label} className="size-5.5 object-contain filter drop-shadow-sm select-none" title={sticker.label} />
                              }
                              return <span className="text-xs">{comm.reaction}</span>
                            })()
                          )}
                        </div>
                        <span className="text-[9px] text-stone-400">{new Date(comm.created_at).toLocaleDateString('vi-VN')}</span>
                      </div>

                      {editingCommentId === comm.id ? (
                        <Input 
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          className="h-8.5 text-xs rounded-full border-stone-250 w-full mt-1 bg-transparent px-3 text-stone-800 dark:text-stone-200"
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveCommentEdit(comm.id)}
                        />
                      ) : (
                        <p className="text-stone-600 dark:text-stone-300 leading-normal text-[11.5px] whitespace-pre-line">{textPart}</p>
                      )}

                      {imgPart && (
                        <div className="relative mt-2 max-w-[150px] rounded-lg overflow-hidden border border-stone-200 dark:border-stone-800 shadow-sm cursor-zoom-in group">
                          <img src={imgPart} alt="Ảnh đính kèm" className="object-cover w-full max-h-32 transition-transform duration-300 group-hover:scale-105" onClick={() => window.open(imgPart, '_blank')} />
                        </div>
                      )}

                      {/* HÀNG NÚT TÁC VỤ BÌNH LUẬN GỐC */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] mt-1.5 select-none font-bold -ml-2">
                        {editingCommentId === comm.id ? (
                          <>
                            <button onClick={() => handleSaveCommentEdit(comm.id)} className={cn("px-2 py-1 rounded-[6px] transition-all duration-200", POPUP_THEME_MAPPING[readerTheme]?.actionBtn)}>Lưu</button>
                            <button onClick={() => setEditingCommentId(null)} className={cn("px-2 py-1 rounded-[6px] transition-all duration-200", POPUP_THEME_MAPPING[readerTheme]?.actionBtn)}>Hủy</button>
                          </>
                        ) : (
                          <>
                            {isSignedIn && (
                              <button onClick={() => handleReplyClick(comm.id, rawName)} className={cn("px-2 py-1 rounded-[6px] transition-all duration-200", POPUP_THEME_MAPPING[readerTheme]?.actionBtn)}>Phản hồi</button>
                            )}

                            {/* NÚT THẢ DẤU CHÂN: BẤM MỞ FLOATING PALETTE NGOÀI KHUNG */}
                            {isSignedIn && (
                              <button
                                type="button"
                                onClick={() => setActivePickerCommentId(activePickerCommentId === comm.id ? null : comm.id)}
                                className={cn("px-2 py-1 rounded-[6px] transition-all duration-200 flex items-center gap-1", POPUP_THEME_MAPPING[readerTheme]?.actionBtn)}
                              >
                                <span>Thả dấu chân</span>
                              </button>
                            )}

                            {(isAdmin || (isSignedIn && user?.id === commentUserId)) && (
                              <>
                                <button onClick={() => handleStartCommentEdit(comm.id, textPart)} className={cn("px-2 py-1 rounded-[6px] transition-all duration-200", POPUP_THEME_MAPPING[readerTheme]?.actionBtn)}>Sửa</button>
                                <button onClick={() => handleDeleteComment(comm.id)} className={cn("px-2 py-1 rounded-[6px] transition-all duration-200", POPUP_THEME_MAPPING[readerTheme]?.actionBtn)}>Xóa</button>
                              </>
                            )}

                            {/* DÃY BADGE DẤU CHÂN ĐÃ THẢ */}
                            <div className="inline-flex items-center gap-1 ml-1">
                              {Object.entries(reactions[comm.id] || {}).map(([sId, data]) => {
                                if (data.count <= 0) return null
                                const stickerObj = KLEIN_STICKERS.find(s => s.id === sId)
                                if (!stickerObj) return null

                                return (
                                  <button
                                    key={sId}
                                    type="button"
                                    onClick={() => handleReactSticker(comm.id, sId)}
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
                          </>
                        )}
                      </div>

                      {/* Form nhập phản hồi */}
                      {replyingToId === comm.id && (
                        <div className="mt-2.5 flex gap-2 max-w-sm items-center animate-in slide-in-from-top-1 duration-150">
                          <Input
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={`Phản hồi ${rawName}...`}
                            className={cn("h-8 rounded-full text-[11px] px-3.5 border focus-visible:ring-0", POPUP_THEME_MAPPING[readerTheme]?.input)}
                            disabled={isSending}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendReply(comm.id)}
                          />
                          <Button onClick={() => handleSendReply(comm.id)} disabled={isSending || !replyText.trim()} size="sm" className={cn("h-8 rounded-full text-[10px] font-bold px-3", POPUP_THEME_MAPPING[readerTheme]?.sendBtn)}>
                            {isSending ? <Loader2 className="size-3 animate-spin" /> : "Gửi"}
                          </Button>
                        </div>
                      )}

                      {/* VÙNG HIỂN THỊ PHẢN HỒI CON (REPLIES) */}
                      {replies.length > 0 && (
                        <div className="mt-2.5 space-y-2">
                          <button onClick={() => toggleExpanded(comm.id)} className={cn("flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 -ml-2 rounded-[6px] transition-all duration-200", POPUP_THEME_MAPPING[readerTheme]?.actionBtn)}>
                            <span>₍^•⩊•^₎Ⳋ</span> {isExpanded ? "Ẩn phản hồi" : `Xem ${replies.length} phản hồi`}
                          </button>

                          {isExpanded && (
                            <div className={cn("space-y-3.5 pl-4 border-l-2 mt-2.5", POPUP_THEME_MAPPING[readerTheme]?.threadBorder || "border-stone-200")}>
                              {replies.map((reply) => {
                                const rIdParts = (reply.sender_name || '').split(' ||USER_ID||:')
                                const rRawName = rIdParts[0] || 'Ẩn danh'
                                const rCommentUserId = (rIdParts[1] || '').split(' ||AVATAR_URL||:')[0] || ''
                                const rDisplayAvatar = (rIdParts[1] || '').split(' ||AVATAR_URL||:')[1] || ''
                                
                                const rTextPart = (reply.content || '').split(' ||PARENT_ID||:')[0]

                                const isReplyCommenterAdmin = rCommentUserId && rCommentUserId === process.env.NEXT_PUBLIC_ADMIN_ID

                                return (
                                  <div key={reply.id} className="flex gap-2 items-start animate-fade-in">
                                    {rDisplayAvatar ? (
                                      <img src={rDisplayAvatar} alt={rRawName} className="size-6 rounded-full object-cover shrink-0 border" />
                                    ) : (
                                      <div className={cn("flex h-6 w-6 items-center justify-center rounded-full font-bold shrink-0 text-[10px]", POPUP_THEME_MAPPING[readerTheme]?.fallback)}>
                                        {rRawName.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    <div className="flex-1 space-y-0.5">
                                      <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="font-bold text-stone-800 dark:text-stone-300">{rRawName}</span>
                                          
                                          {isReplyCommenterAdmin && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-cute-comfortaa font-bold bg-gradient-to-r from-rose-100 to-amber-100 dark:from-rose-950/40 dark:to-stone-900 border border-rose-200/40 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.15)] dark:shadow-[0_0_15px_rgba(244,63,94,0.3)] scale-[0.85] origin-left select-none">
                                              ⋆. ˚࿔ Admin 𝜗𝜚˚⋆
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-[8px] text-stone-400">{new Date(reply.created_at).toLocaleDateString('vi-VN')}</span>
                                      </div>
                                      
                                      {editingCommentId === reply.id ? (
                                        <Input
                                          value={editingCommentText}
                                          onChange={(e) => setEditingCommentText(e.target.value)}
                                          className="h-8 text-xs rounded-full border-stone-250 w-full bg-transparent px-3 text-stone-800 dark:text-stone-200"
                                          onKeyDown={(e) => e.key === 'Enter' && handleSaveCommentEdit(reply.id)}
                                        />
                                      ) : (
                                        <p className="text-stone-600 dark:text-stone-400 leading-normal text-[11px]">{rTextPart}</p>
                                      )}

                                      {/* TÁC VỤ TRÊN PHẢN HỒI CON */}
                                      <div className="flex flex-wrap gap-1 text-[10px] mt-1 select-none font-bold -ml-2">
                                        {editingCommentId === reply.id ? (
                                          <>
                                            <button onClick={() => handleSaveCommentEdit(reply.id)} className={cn("px-2 py-1 rounded-[6px] transition-all duration-200", POPUP_THEME_MAPPING[readerTheme]?.actionBtn)}>Lưu</button>
                                            <button onClick={() => setEditingCommentId(null)} className={cn("px-2 py-1 rounded-[6px] transition-all duration-200", POPUP_THEME_MAPPING[readerTheme]?.actionBtn)}>Hủy</button>
                                          </>
                                        ) : (
                                          <>
                                            {isSignedIn && (
                                              <button onClick={() => handleReplyClick(reply.id, rRawName)} className={cn("px-2 py-1 rounded-[6px] transition-all duration-200", POPUP_THEME_MAPPING[readerTheme]?.actionBtn)}>Phản hồi</button>
                                            )}

                                            {/* NÚT "Thả dấu chân" CHO PHẢN HỒI CON */}
                                            {isSignedIn && (
                                              <button
                                                type="button"
                                                onClick={() => setActivePickerCommentId(activePickerCommentId === reply.id ? null : reply.id)}
                                                className={cn("px-2 py-1 rounded-[6px] transition-all duration-200 flex items-center gap-1", POPUP_THEME_MAPPING[readerTheme]?.actionBtn)}
                                              >
                                                <span>Thả dấu chân</span>
                                              </button>
                                            )}

                                            {(isAdmin || (isSignedIn && user?.id === rCommentUserId)) && (
                                              <>
                                                <button onClick={() => handleStartCommentEdit(reply.id, rTextPart)} className={cn("px-2 py-1 rounded-[6px] transition-all duration-200", POPUP_THEME_MAPPING[readerTheme]?.actionBtn)}>Sửa</button>
                                                <button onClick={() => handleDeleteComment(reply.id)} className={cn("px-2 py-1 rounded-[6px] transition-all duration-200", POPUP_THEME_MAPPING[readerTheme]?.actionBtn)}>Xóa</button>
                                              </>
                                            )}

                                            {/* BADGES DẤU CHÂN ĐÃ THẢ TRÊN PHẢN HỒI CON */}
                                            <div className="inline-flex items-center gap-1 ml-1">
                                              {Object.entries(reactions[reply.id] || {}).map(([sId, data]) => {
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
                                          </>
                                        )}
                                      </div>

                                      {/* Form nhập phản hồi con */}
                                      {replyingToId === reply.id && (
                                        <div className="mt-2 flex gap-2 max-w-[200px] sm:max-w-xs items-center animate-in slide-in-from-top-1 duration-150">
                                          <Input
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder={`Phản hồi ${rRawName}...`}
                                            className={cn("h-8 rounded-full text-[10px] px-3 border focus-visible:ring-0", POPUP_THEME_MAPPING[readerTheme]?.input)}
                                            disabled={isSending}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendReply(comm.id)} 
                                          />
                                          <Button onClick={() => handleSendReply(comm.id)} disabled={isSending || !replyText.trim()} size="sm" className={cn("h-8 rounded-full text-[9px] font-bold px-2.5", POPUP_THEME_MAPPING[readerTheme]?.sendBtn)}>
                                            {isSending ? <Loader2 className="size-3 animate-spin" /> : "Gửi"}
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center text-stone-400 space-y-2">
                <img src="/klein.png" alt="Trống" className="w-12 h-9 object-contain opacity-50 dark:brightness-125 dark:drop-shadow-[0_0_3px_rgba(255,255,255,0.2)]" />
                <p className="text-xs italic font-semibold text-stone-400 dark:text-stone-500">Chưa có mèo nhỏ nào bày tỏ meo meo ₍^. .^₎⟆</p>
              </div>
            )}
          </div>

          {/* 🌟 BẢNG CHỌN STICKER KLEIN THẢ DẤU CHÂN FLOATING PALETTE NỔI TRỰC TIẾP Ở NỀN MODAL (KHÔNG BAO GIỜ BỊ OVERFLOW CHE CẮT) */}
          {activePickerCommentId && (
            <div className="absolute bottom-[76px] left-4 right-4 z-[99999] p-4 rounded-[24px] border-2 border-[#D89A52] bg-[#FAF3EB] dark:bg-[#1E1410] shadow-[0_12px_35px_rgba(0,0,0,0.35)] animate-in fade-in slide-in-from-bottom-3 duration-200 font-sans">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#EADBC8] dark:border-stone-800">
                <span className="text-xs font-extrabold text-[#7A4F37] dark:text-[#F4C27A] uppercase tracking-wider flex items-center gap-1.5">
                  <span>Thả dấu chân Mèo Klein </span> ({KLEIN_STICKERS.length})
                </span>
                <button
                  type="button"
                  onClick={() => setActivePickerCommentId(null)}
                  className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1 rounded-full hover:bg-[#EADBC8]/50 transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-1">
                {KLEIN_STICKERS.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleReactSticker(activePickerCommentId, st.id)}
                    className="p-1.5 rounded-xl bg-white dark:bg-[#2C1F1A] border border-[#EEDFD0]/80 dark:border-stone-800 hover:border-[#D89A52] hover:scale-110 active:scale-95 transition-all duration-150 flex items-center justify-center shadow-xs"
                    title={st.label}
                  >
                    <img src={st.url} alt={st.label} className="size-9 object-contain select-none" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Khung dưới cùng */}
          {!isSignedIn ? (
            <div className="text-center py-4 bg-stone-50/50 dark:bg-stone-950/20 rounded-2xl border border-dashed border-stone-200 dark:border-stone-850 mt-2">
              <p className="text-xs text-stone-500">
                Vui lòng{" "}
                <SignInButton mode="modal">
                  <span className="text-[#8B5E3C] dark:text-[#EADBC8] hover:underline font-bold cursor-pointer">
                    đăng nhập
                  </span>
                </SignInButton>{" "}
                để gửi lời meo meo.
              </p>
            </div>
          ) : (
            <div className="border-t border-stone-100 dark:border-stone-850 pt-4 mt-2 space-y-2.5">
              {commentImgUrl && (
                <div className="relative inline-block mt-1">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#E5D8C8] shadow-sm">
                    <img src={commentImgUrl} alt="Preview" className="object-cover w-full h-full" />
                  </div>
                  <button 
                    onClick={() => setCommentImgUrl('')}
                    className={cn(
                      "absolute -top-1.5 -right-1.5 rounded-full p-0.5 border shadow transition-transform active:scale-95",
                      POPUP_THEME_MAPPING[readerTheme]?.sendBtn
                    )}
                  >
                    <X className="size-2.5" />
                  </button>
                </div>
              )}

              <div className="flex gap-2 items-center">
                <input type="file" ref={commentFileInputRef} onChange={handleCommentImageUpload} accept="image/*" className="hidden" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => commentFileInputRef.current?.click()}
                  disabled={isUploadingCommentImg || isSending}
                  className={cn(
                    "h-10 w-10 shrink-0 rounded-full border transition-colors",
                    POPUP_THEME_MAPPING[readerTheme]?.input,
                    POPUP_THEME_MAPPING[readerTheme]?.imgBtn
                  )}
                >
                  {isUploadingCommentImg ? <Loader2 className="size-4 animate-spin text-[#8B5E3C] dark:text-[#EADBC8]" /> : <ImageIcon className="size-4 text-[#8B5E3C] dark:text-[#EADBC8]" />}
                </Button>

                <Input 
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Meo meo meo..."
                  className={cn("h-10 rounded-full focus-visible:outline-none focus-visible:ring-1 px-4 text-xs flex-1 border", POPUP_THEME_MAPPING[readerTheme]?.input)}
                  disabled={isSending}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendParaComment()}
                />
                <Button 
                  onClick={handleSendParaComment}
                  disabled={isSending || isUploadingCommentImg || (!commentText.trim() && !commentImgUrl)}
                  className={cn("rounded-full h-10 px-5 text-xs font-bold transition-all", POPUP_THEME_MAPPING[readerTheme]?.sendBtn)}
                >
                  {isSending ? <Loader2 className="size-3.5 animate-spin" /> : "Gửi"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  )
}