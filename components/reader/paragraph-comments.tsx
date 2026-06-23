'use client'

import Link from 'next/link'
import { Loader2, X, ImageIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'

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
  isSignedIn: boolean
  user: any
  isAdmin: boolean
  POPUP_THEME_MAPPING: any
  readerTheme: string
  // Các props bổ sung cho phản hồi và hộp gập thông minh [2.5]
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

  // 🌟 LỌC LẤY TOÀN BỘ BÌNH LUẬN GỐC (ROOT COMMENTS - KHÔNG CHỨA TOKEN PARENT_ID) [2.5]
  const roots = useMemo(() => {
    return textComments.filter(c => {
      const parentParts = (c.content || '').split(' ||PARENT_ID||:')
      return !parentParts[1] // Không có parent_id -> Là bình luận gốc [2.5]
    })
  }, [textComments])

  // 🌟 LỌC VÀ GOM NHÓM CÁC CÂU TRẢ LỜI THEO ID CỦA BÌNH LUẬN GỐC [2.5]
  const repliesMap = useMemo(() => {
    const map: Record<number, any[]> = {}
    textComments.forEach(c => {
      const parentParts = (c.content || '').split(' ||PARENT_ID||:')
      const parentId = parentParts[1] ? parseInt(parentParts[1]) : null
      if (parentId) {
        if (!map[parentId]) map[parentId] = []
        map[parentId].push(c)
      }
    })
    return map
  }, [textComments])

  return (
    paraCommentOpen && (
      <div
        onClick={() => setParaCommentOpen(false)}
        className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 font-sans animate-in fade-in duration-200"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "relative w-full max-w-lg rounded-[2.5rem] p-6 shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 border",
            POPUP_THEME_MAPPING[readerTheme]?.container
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <img src="/klein.png" alt="Klein" className="w-7 h-5.5 object-contain" />
              <span className="font-serif font-bold text-base">₍^ &gt;⩊&lt; ^₎Ⳋ Gửi lời meo meo vào đây</span>
            </div>
            <button
              onClick={() => setParaCommentOpen(false)}
              className={cn("transition-colors rounded p-1", POPUP_THEME_MAPPING[readerTheme]?.close)}
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Quote Card */}
          <div className={cn("p-3.5 rounded-2xl text-xs italic line-clamp-3 leading-relaxed border mb-4 mt-2", POPUP_THEME_MAPPING[readerTheme]?.quote)}>
            &ldquo;{activeParaText}&rdquo;
          </div>

          {/* Discord Reaction Board */}
          <div className="text-center space-y-2 mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider block text-stone-400 dark:text-stone-500">Để lại dấu chân của bạn</span>
            <div className={cn("grid grid-cols-5 sm:grid-cols-6 gap-2 p-2.5 rounded-3xl border max-h-40 overflow-y-auto justify-items-center w-full shadow-inner", POPUP_THEME_MAPPING[readerTheme]?.reactionBg)}>
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
                      isSelected ? POPUP_THEME_MAPPING[readerTheme]?.activeEmoji : "bg-[#FFFDFB] dark:bg-stone-900 border-stone-200/40 dark:border-stone-850"
                    )}
                    title={sticker.label}
                  >
                    <div className="w-10 h-10 flex items-center justify-center">
                      <img src={`/stickers/${sticker.file}`} alt={sticker.label} className="w-full h-full object-contain rounded-md" />
                    </div>
                    {count > 0 && (
                      <span className={cn("text-[9px] font-bold px-1 py-0.5 rounded-full border leading-none scale-90", isSelected ? POPUP_THEME_MAPPING[readerTheme]?.activeBadge : POPUP_THEME_MAPPING[readerTheme]?.inactiveBadge)}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Comment Thread List */}
          <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1 min-h-[150px]">
            {isLoadingComments ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Loader2 className="size-5 animate-spin text-[#8B5E3C] dark:text-[#EADBC8]" />
                <span className="text-xs text-stone-400">Đang tải bình luận đoạn...</span>
              </div>
            ) : roots.length > 0 ? (
              roots.map((comm) => {
                // Phân tách Metadata người dùng [2.5]
                const idParts = (comm.sender_name || '').split(' ||USER_ID||:')
                const rawName = idParts[0] || 'Ẩn danh'
                const restParts = idParts[1] || ''
                const avatarParts = restParts.split(' ||AVATAR_URL||:')
                const commentUserId = avatarParts[0] || ''
                const displayAvatar = avatarParts[1] || ''

                // Phân tách nội dung text và ảnh đính kèm [1.1.1]
                const parentParts = (comm.content || '').split(' ||PARENT_ID||:')
                const rootAndImage = parentParts[0]
                const contentParts = rootAndImage.split(' ||IMAGE_URL||:')
                const textPart = contentParts[0]
                const imgPart = contentParts[1]

                // Danh sách replies của bình luận gốc này [2.5]
                const childReplies = repliesMap[comm.id] || []
                const isExpanded = expandedCommentIds.includes(comm.id)

                return (
                  <div key={comm.id} className={cn("space-y-2 pb-3 border-b", POPUP_THEME_MAPPING[readerTheme]?.threadBorder)}>
                    
                    {/* BÌNH LUẬN GỐC */}
                    <div className="flex gap-2.5 items-start text-xs">
                      {displayAvatar ? (
                        <img src={displayAvatar} alt={rawName} className="size-7 rounded-full object-cover shrink-0 border border-stone-200 dark:border-stone-700 shadow-sm" />
                      ) : (
                        <div className={cn("flex h-7 w-7 items-center justify-center rounded-full font-bold shrink-0 text-xs border border-stone-200/20", POPUP_THEME_MAPPING[readerTheme]?.fallback)}>
                          {rawName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-stone-800 dark:text-stone-200">{rawName}</span>
                            {comm.reaction && (
                              (() => {
                                const sticker = sortedStickers.find(s => s.id === comm.reaction)
                                if (sticker) {
                                  return <img src={`/stickers/${sticker.file}`} alt={sticker.label} className="size-5.5 object-contain filter drop-shadow-sm select-none" />
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
                            className="h-8 text-xs rounded-full border-stone-250 w-full mt-1 bg-transparent px-3 text-stone-800 dark:text-stone-200"
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveCommentEdit(comm.id)}
                          />
                        ) : (
                          <p className="text-stone-600 dark:text-stone-300 leading-normal text-[11.5px] whitespace-pre-line">{textPart}</p>
                        )}

                        {imgPart && (
                          <div className="relative mt-2 max-w-[150px] rounded-lg overflow-hidden border border-stone-200 dark:border-stone-800 shadow-sm cursor-zoom-in group">
                            <img src={imgPart} alt="Ảnh đính kèm" className="object-cover w-full max-h-32" onClick={() => window.open(imgPart, '_blank')} />
                          </div>
                        )}

                        {/* THANH HÀNH ĐỘNG ROOT COMMENT: Phản hồi, Sửa, Xóa */}
                        <div className="flex gap-2.5 text-[10px] mt-1 select-none font-bold">
                          {/* NÚT PHẢN HỒI (REPLY LINK - ĐỒNG BỘ MÀU CHỦ ĐỀ HOÀN TOÀN) [1.1.2] */}
                          <button
                            onClick={() => {
                              setReplyingToId(replyingToId === comm.id ? null : comm.id)
                              setReplyText('')
                            }}
                            className={cn("flex items-center gap-1 transition-colors", POPUP_THEME_MAPPING[readerTheme]?.editBtn)}
                          >
                            <svg className="size-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            Phản hồi
                          </button>

                          {(isAdmin || (isSignedIn && user?.id === commentUserId)) && (
                            <>
                              {editingCommentId === comm.id ? (
                                <>
                                  <button onClick={() => handleSaveCommentEdit(comm.id)} className="hover:text-green-600">Lưu</button>
                                  <button onClick={() => setEditingCommentId(null)} className="hover:text-stone-600">Hủy</button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => handleStartCommentEdit(comm.id, textPart)} className={cn("transition-colors", POPUP_THEME_MAPPING[readerTheme]?.editBtn)}>Sửa</button>
                                  <button onClick={() => handleDeleteComment(comm.id)} className={cn("transition-colors", POPUP_THEME_MAPPING[readerTheme]?.deleteBtn)}>Xóa</button>
                                </>
                              )}
                            </>
                          )}
                        </div>

                        {/* NÚT XEM / GẬP PHẢN HỒI (ĐGỘ BỘ THEME MÈO) [1, 2.5] */}
                        {childReplies.length > 0 && (
                          <button
                            onClick={() => toggleExpanded(comm.id)}
                            className={cn("flex items-center gap-1 text-[10px] font-bold transition-colors mt-2 pb-1 select-none", POPUP_THEME_MAPPING[readerTheme]?.editBtn)}
                          >
                            <span className="text-[11px] font-sans mr-0.5 leading-none">ฅ^•ﻌ•^ฅ</span>
                            {isExpanded ? "Ẩn phản hồi" : `Xem ${childReplies.length} phản hồi`}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* DANH SÁCH PHẢN HỒI LỒNG NHAU (ĐỒNG BỘ ĐƯỜNG KẺ DỌC MÀU THỂ NỀN) [2.5] */}
                    {childReplies.length > 0 && isExpanded && (
                      <div className={cn("pl-8 border-l-2 space-y-3 mt-2 animate-fade-in", POPUP_THEME_MAPPING[readerTheme]?.threadBorder)}>
                        {childReplies.map((reply) => {
                          const replyIdParts = (reply.sender_name || '').split(' ||USER_ID||:')
                          const replyRawName = replyIdParts[0] || 'Ẩn danh'
                          const replyRestParts = replyIdParts[1] || ''
                          const replyAvatarParts = replyRestParts.split(' ||AVATAR_URL||:')
                          const replyCommentUserId = replyAvatarParts[0] || ''
                          const replyDisplayAvatar = replyAvatarParts[1] || ''

                          const rParentParts = (reply.content || '').split(' ||PARENT_ID||:')
                          const rRootAndImage = rParentParts[0]
                          const rContentParts = rRootAndImage.split(' ||IMAGE_URL||:')
                          const replyTextPart = rContentParts[0]
                          const replyImgPart = rContentParts[1]

                          return (
                            <div key={reply.id} className="flex gap-2 items-start text-xs pt-1">
                              {replyDisplayAvatar ? (
                                <img src={replyDisplayAvatar} alt={replyRawName} className="size-5.5 rounded-full object-cover shrink-0 border border-stone-200 dark:border-stone-700 shadow-sm" />
                              ) : (
                                <div className={cn("flex h-5.5 w-5.5 items-center justify-center rounded-full font-bold shrink-0 text-[10px] border border-stone-200/20", POPUP_THEME_MAPPING[readerTheme]?.fallback)}>
                                  {replyRawName.charAt(0).toUpperCase()}
                                </div>
                              )}
                              
                              <div className="flex-1 space-y-0.5">
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="font-bold text-stone-700 dark:text-stone-300">{replyRawName}</span>
                                  <span className="text-stone-400">{new Date(reply.created_at).toLocaleDateString('vi-VN')}</span>
                                </div>

                                {editingCommentId === reply.id ? (
                                  <Input
                                    value={editingCommentText}
                                    onChange={(e) => setEditingCommentText(e.target.value)}
                                    className="h-7.5 text-xs rounded-full border-stone-250 w-full mt-1 bg-transparent px-3 text-stone-800 dark:text-stone-200"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveCommentEdit(reply.id)}
                                  />
                                ) : (
                                  <p className="text-stone-600 dark:text-stone-400 leading-normal text-[11px] whitespace-pre-line">{replyTextPart}</p>
                                )}

                                {replyImgPart && (
                                  <div className="relative mt-1 max-w-[100px] rounded-lg overflow-hidden border border-stone-200 shadow-sm">
                                    <img src={replyImgPart} alt="Đính kèm" className="object-cover w-full max-h-24" onClick={() => window.open(replyImgPart, '_blank')} />
                                  </div>
                                )}

                                {/* THANH HÀNH ĐỘNG CHO REPLY: Phản hồi, Sửa, Xóa */}
                                <div className="flex gap-2 text-[9px] mt-0.5 select-none font-bold">
                                  {/* BẤM PHẢN HỒI REPLY SẼ TỰ ĐỘNG GẮN TAG TÊN VÀ ĐẨY VÀO LUỒNG CMT GỐC [2.5] */}
                                  <button
                                    onClick={() => {
                                      setReplyingToId(comm.id) // Gộp phẳng dưới comment gốc [2.5]
                                      setReplyText(`@${replyRawName} `) // Gắn tag tên [2.5]
                                    }}
                                    className={cn("flex items-center gap-1 transition-colors", POPUP_THEME_MAPPING[readerTheme]?.editBtn)}
                                  >
                                    Phản hồi
                                  </button>

                                  {(isAdmin || (isSignedIn && user?.id === replyCommentUserId)) && (
                                    <>
                                      {editingCommentId === reply.id ? (
                                        <>
                                          <button onClick={() => handleSaveCommentEdit(reply.id)} className="hover:text-green-600">Lưu</button>
                                          <button onClick={() => setEditingCommentId(null)} className="hover:text-stone-600">Hủy</button>
                                        </>
                                      ) : (
                                        <>
                                          <button onClick={() => handleStartCommentEdit(reply.id, replyTextPart)} className={cn("transition-colors", POPUP_THEME_MAPPING[readerTheme]?.editBtn)}>Sửa</button>
                                          <button onClick={() => handleDeleteComment(reply.id)} className={cn("transition-colors", POPUP_THEME_MAPPING[readerTheme]?.deleteBtn)}>Xóa</button>
                                        </>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* KHUNG SOẠN TIN PHẢN HỒI LỒNG NHAU (Ẩn hiện khi bấm nút Phản hồi) [2.5] */}
                    {replyingToId === comm.id && (
                      <div className="mt-3 pl-8 flex gap-2 items-center animate-fade-in">
                        <Input
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Meo meo meo phản hồi..."
                          className={cn("h-8.5 rounded-full px-3 text-xs flex-1 border", POPUP_THEME_MAPPING[readerTheme]?.input)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendReply(comm.id)}
                          disabled={isSending}
                        />
                        <Button
                          onClick={() => handleSendReply(comm.id)}
                          disabled={isSending || !replyText.trim()}
                          size="sm"
                          className={cn("rounded-full h-8.5 px-4 text-xs font-bold transition-all", POPUP_THEME_MAPPING[readerTheme]?.sendBtn)}
                        >
                          {isSending ? <Loader2 className="size-3 animate-spin" /> : "Phản hồi"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReplyingToId(null)}
                          className="h-8.5 rounded-full text-stone-400 hover:text-stone-600"
                        >
                          Hủy
                        </Button>
                      </div>
                    )}

                  </div>
                )
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center text-stone-400 space-y-2">
                {/* Thay emoji Peach bằng hình Klein mờ nghệ thuật */}
                <img 
                  src="/klein.png" 
                  alt="Trống" 
                  className="w-12 h-9 object-contain opacity-50 dark:brightness-125 dark:drop-shadow-[0_0_3px_rgba(255,255,255,0.2)]"
                />
                <p className="text-xs italic font-semibold text-stone-400 dark:text-stone-500">Chưa có mèo nhỏ nào bày tỏ meo meo ₍^. .^₎⟆</p>
              </div>
            )}
          </div>

          {/* Form Comment Box chính ở chân Popup */}
          {!isSignedIn ? (
            <div className="text-center py-4 bg-stone-50/50 dark:bg-stone-950/20 rounded-2xl border border-dashed mt-2">
              <p className="text-xs text-stone-500">Vui lòng <Link href="/sign-in" className="text-[#8B5E3C] dark:text-[#EADBC8] hover:underline font-bold">đăng nhập</Link> để gửi lời meo meo.</p>
            </div>
          ) : (
            <div className="border-t border-stone-100 dark:border-stone-850 pt-4 mt-2 space-y-2.5">
              {commentImgUrl && (
                <div className="relative inline-block mt-1">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#E5D8C8]">
                    <img src={commentImgUrl} alt="Preview" className="object-cover w-full h-full" />
                  </div>
                  <button onClick={() => setCommentImgUrl('')} className={cn("absolute -top-1.5 -right-1.5 rounded-full p-0.5 border shadow", POPUP_THEME_MAPPING[readerTheme]?.sendBtn)}>
                    <X className="size-2.5" />
                  </button>
                </div>
              )}

              <div className="flex gap-2 items-center">
                <input type="file" ref={commentFileInputRef} onChange={handleCommentImageUpload} accept="image/*" className="hidden" />
                
                {/* 🌟 NÚT TẢI FILE ĐỒNG BỘ HOÀN TOÀN MÀU NỀN HOVER & ICON THEO CHỦ ĐỀ CHỌN [1.1.2] */}
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => commentFileInputRef.current?.click()}
                  disabled={isUploadingCommentImg || isSending}
                  className={cn(
                    "h-10 w-10 shrink-0 rounded-full border transition-colors", 
                    POPUP_THEME_MAPPING[readerTheme]?.input, // Kế thừa khung nền gốc
                    readerTheme === 'light' && "hover:bg-[#F4EEE6]",
                    readerTheme === 'dark' && "hover:bg-stone-800",
                    readerTheme === 'sepia' && "hover:bg-[#EADBC8]",
                    readerTheme === 'emerald' && "hover:bg-[#DDE6D5]",
                    readerTheme === 'coffee' && "hover:bg-[#E0D2C8]",
                    readerTheme === 'rose' && "hover:bg-[#F9E2E5]"
                  )}
                >
                  {isUploadingCommentImg ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ImageIcon className={cn(
                      "size-4 transition-colors", 
                      readerTheme === 'light' && "text-[#5C3D2E]",
                      readerTheme === 'dark' && "text-stone-300",
                      readerTheme === 'sepia' && "text-[#5C3D2E]",
                      readerTheme === 'emerald' && "text-[#3B4D31]",
                      readerTheme === 'coffee' && "text-[#4A3228]",
                      readerTheme === 'rose' && "text-[#632B30]"
                    )} />
                  )}
                </Button>

                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Meo meo meo..."
                  className={cn("h-10 rounded-full focus-visible:outline-none focus-visible:ring-1 px-4 text-xs flex-1 border", POPUP_THEME_MAPPING[readerTheme]?.input)}
                  disabled={isSending}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendParaComment()}
                />
                <Button onClick={handleSendParaComment} disabled={isSending || isUploadingCommentImg || (!commentText.trim() && !commentImgUrl)} className={cn("rounded-full h-10 px-5 text-xs font-bold transition-all", POPUP_THEME_MAPPING[readerTheme]?.sendBtn)}>
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