'use client'

import { Loader2, X, Image as ImageIcon, MessageSquare } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ChapterCommentsProps {
  chapterComments: any[]
  isLoading: boolean
  isSending: boolean
  isUploadingCommentImg: boolean
  commentText: string
  setCommentText: (text: string) => void
  commentImgUrl: string
  setCommentImgUrl: (url: string) => void
  commentFileInputRef: React.RefObject<HTMLInputElement | null>
  handleCommentImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleStickerClick: (id: string) => void
  handleSendChapterComment: () => void
  userReactions: string[]
  sortedStickers: any[]
  parsedParagraphs: string[]
  editingCommentId: number | null
  editingCommentText: string
  setEditingCommentText: (text: string) => void
  handleStartCommentEdit: (id: number, text: string) => void
  handleSaveCommentEdit: (id: number) => void
  handleDeleteComment: (id: number) => void
  setEditingCommentId: (id: number | null) => void // 🌟 ĐÃ THÊM KHAI BÁO BIẾN TRONG INTERFACE
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

export function ChapterComments({
  chapterComments,
  isLoading,
  isSending,
  isUploadingCommentImg,
  commentText,
  setCommentText,
  commentImgUrl,
  setCommentImgUrl,
  commentFileInputRef,
  handleCommentImageUpload,
  handleSendChapterComment,
  sortedStickers,
  editingCommentId,
  editingCommentText,
  setEditingCommentText,
  handleStartCommentEdit,
  handleSaveCommentEdit,
  handleDeleteComment,
  setEditingCommentId, // 🌟 ĐÃ NHẬN BIẾN THỰC THI Ở ĐÂY
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
}: ChapterCommentsProps) {
  // Lọc các phản hồi lồng nhau và cảm xúc Discord để chỉ hiển thị cột chữ chuẩn [1.1.2]
  const rootComments = chapterComments.filter(
    c => c.content && c.content !== '||DISCORD_REACTION||' && !c.content?.includes('||PARENT_ID||:')
  )

  const getReplies = (parentId: number) => {
    return chapterComments.filter(c => c.content?.includes(`||PARENT_ID||:${parentId}`))
  }

  // Hàm xử lý khi bấm phản hồi: tự động điền tag tên @Username [1, 2]
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
    <div className="mt-12 border-t border-dashed border-stone-200 dark:border-stone-800 pt-8 font-sans animate-fade-in">
      {/* Nhúng font chữ tròn trịa cho nhãn Admin lấp lánh ở trang bình luận chương [MỚI] */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@600;700&display=swap');
        .font-cute-comfortaa {
          font-family: 'Comfortaa', sans-serif !important;
        }
      `}} />

      <div className="flex items-center gap-2 mb-6">
        <img src="/klein.png" alt="Klein" className="w-8 h-6 object-contain animate-pulse" />
        <h3 className="font-serif font-bold text-lg">Bình luận chương ({rootComments.length})</h3>
      </div>

      {/* Form gửi bình luận chương */}
      {!isSignedIn ? (
        <div className="text-center py-4 bg-stone-50/50 dark:bg-stone-950/20 rounded-2xl border border-dashed mb-6">
          <p className="text-xs text-stone-500">Vui lòng đăng nhập để bình luận chương.</p>
        </div>
      ) : (
        <div className="space-y-2.5 mb-8">
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
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => commentFileInputRef.current?.click()}
              disabled={isUploadingCommentImg || isSending}
              className={cn(
                "h-10 w-10 shrink-0 rounded-full border transition-all duration-200", 
                POPUP_THEME_MAPPING[readerTheme]?.input, 
                POPUP_THEME_MAPPING[readerTheme]?.imgBtn
              )}
            >
              {isUploadingCommentImg ? <Loader2 className="size-4 animate-spin text-[#8B5E3C]" /> : <ImageIcon className="size-4 text-[#8B5E3C] dark:text-[#EADBC8]" />}
            </Button>

            <Input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Meo meo meo..."
              className={cn("h-10 rounded-full focus-visible:outline-none focus-visible:ring-1 px-4 text-xs flex-1 border", POPUP_THEME_MAPPING[readerTheme]?.input)}
              disabled={isSending}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChapterComment()}
            />
            <Button onClick={handleSendChapterComment} disabled={isSending || isUploadingCommentImg || (!commentText.trim() && !commentImgUrl)} className={cn("rounded-full h-10 px-5 text-xs font-bold transition-all", POPUP_THEME_MAPPING[readerTheme]?.sendBtn)}>
              {isSending ? <Loader2 className="size-3.5 animate-spin" /> : "Gửi"}
            </Button>
          </div>
        </div>
      )}

      {/* Danh sách bình luận chương */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Loader2 className="size-5 animate-spin text-[#8B5E3C]" />
            <span className="text-xs text-stone-400">Đang tải bình luận chương...</span>
          </div>
        ) : rootComments.length > 0 ? (
          <div className="space-y-4">
            {rootComments.map((comm) => {
              const idParts = (comm.sender_name || '').split(' ||USER_ID||:')
              const rawName = idParts[0] || 'Ẩn danh'
              const restParts = idParts[1] || ''
              const avatarParts = restParts.split(' ||AVATAR_URL||:')
              const commentUserId = avatarParts[0] || ''
              const displayAvatar = avatarParts[1] || ''

              const contentParts = (comm.content || '').split(' ||IMAGE_URL||:')
              const textPart = contentParts[0]
              const imgPart = contentParts[1]

              const replies = getReplies(comm.id)
              const isExpanded = expandedCommentIds.includes(comm.id)

              return (
                <div key={comm.id} className="flex gap-2.5 items-start text-xs border-b border-stone-150/50 dark:border-stone-850 pb-4">
                  {displayAvatar ? (
                    <img src={displayAvatar} alt={rawName} className="size-8 rounded-full object-cover shrink-0 border border-stone-200 dark:border-stone-700 shadow-sm" />
                  ) : (
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-full font-bold shrink-0 text-xs border border-stone-200/20", POPUP_THEME_MAPPING[readerTheme]?.fallback)}>
                      {rawName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 space-y-1 text-left">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-stone-900 dark:text-stone-100">{rawName}</span>
                        {comm.paragraph_index !== -1 && (
                          <span className="text-[9px] bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded text-stone-500 font-medium select-none">Đoạn {comm.paragraph_index + 1}</span>
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
                      <div className="relative mt-2 max-w-[150px] rounded-lg overflow-hidden border border-stone-200 dark:border-stone-800 shadow-sm cursor-zoom-in">
                        <img src={imgPart} alt="Ảnh đính kèm" className="object-cover w-full max-h-32" onClick={() => window.open(imgPart, '_blank')} />
                      </div>
                    )}

                    {/* Actions: Phản hồi, Sửa, Xóa */}
                    <div className="flex gap-3 text-[10px] mt-1 select-none font-bold">
                      {editingCommentId === comm.id ? (
                        <>
                          <button onClick={() => handleSaveCommentEdit(comm.id)} className="hover:text-green-600">Lưu</button>
                          <button onClick={() => setEditingCommentId(null)} className="hover:text-stone-600">Hủy</button>
                        </>
                      ) : (
                        <>
                          {isSignedIn && (
                            <button onClick={() => handleReplyClick(comm.id, rawName)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">Phản hồi</button>
                          )}
                          {(isAdmin || (isSignedIn && user?.id === commentUserId)) && (
                            <>
                              <button onClick={() => handleStartCommentEdit(comm.id, textPart)} className={cn("transition-colors", POPUP_THEME_MAPPING[readerTheme]?.editBtn)}>Sửa</button>
                              <button onClick={() => handleDeleteComment(comm.id)} className={cn("transition-colors", POPUP_THEME_MAPPING[readerTheme]?.deleteBtn)}>Xóa</button>
                            </>
                          )}
                        </>
                      )}
                    </div>

                    {/* Reply Form */}
                    {replyingToId === comm.id && (
                      <div className="mt-2.5 flex gap-2 max-w-md items-center animate-in slide-in-from-top-1 duration-150">
                        <Input
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={`Phản hồi ${rawName}...`}
                          className={cn("h-8 rounded-full text-xs px-3.5 border focus-visible:ring-0", POPUP_THEME_MAPPING[readerTheme]?.input)}
                          disabled={isSending}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendReply(comm.id)}
                        />
                        <Button onClick={() => handleSendReply(comm.id)} disabled={isSending || !replyText.trim()} size="sm" className={cn("h-8 rounded-full text-[10px] font-bold px-3", POPUP_THEME_MAPPING[readerTheme]?.sendBtn)}>
                          {isSending ? <Loader2 className="size-3 animate-spin" /> : "Gửi"}
                        </Button>
                      </div>
                    )}

                    {/* Replies Thread */}
                    {replies.length > 0 && (
                      <div className="mt-2 text-left">
                        {/* 🌟 ĐỒNG BỘ NÚT SHOW PHẢN HỒI HÌNH CON MÈO KLEIN 100% [1, 2] */}
                        <button onClick={() => toggleExpanded(comm.id)} className="flex items-center gap-1.5 text-[10px] font-bold text-stone-400 hover:text-stone-600 dark:hover:text-stone-200">
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

                              // Kiểm tra xem người viết phản hồi chương này có phải Admin (Chủ nhà) không [MỚI]
                              const isReplyCommenterAdmin = rCommentUserId && rCommentUserId === process.env.NEXT_PUBLIC_ADMIN_ID

                              return (
                                <div key={reply.id} className="flex gap-2 items-start">
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

                                        {/* 🌟 HIỂN THỊ NHÃN CHỦ NHÀ TĨNH LẶNG TINH TẾ TRÊN PHẢN HỒI CON [MỚI] */}
                                        {isReplyCommenterAdmin && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-cute-comfortaa font-bold bg-gradient-to-r from-rose-100 to-amber-100 dark:from-rose-950/40 dark:to-stone-900 border border-rose-200/40 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.15)] dark:shadow-[0_0_15px_rgba(244,63,94,0.3)] scale-[0.85] origin-left select-none">
                                            ⋆. ˚࿔ Chủ nhà 𝜗𝜚˚⋆
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

                                    <div className="flex gap-2 text-[9px] font-bold mt-0.5">
                                      {editingCommentId === reply.id ? (
                                        <>
                                          <button onClick={() => handleSaveCommentEdit(reply.id)} className="hover:text-green-650">Lưu</button>
                                          <button onClick={() => setEditingCommentId(null)} className="hover:text-stone-600">Hủy</button>
                                        </>
                                      ) : (
                                        <>
                                          {/* 🌟 NÂNG CẤP PHẢN HỒI VĨNH VIỄN CHO PHẢN HỒI CON (Gắn tag @Username thông minh) [1, 2] */}
                                          {isSignedIn && (
                                            <button onClick={() => handleReplyClick(reply.id, rRawName)} className="text-stone-450 hover:text-stone-600 dark:hover:text-stone-300">Phản hồi</button>
                                          )}
                                          {(isAdmin || (isSignedIn && user?.id === rCommentUserId)) && (
                                            <>
                                              <button onClick={() => handleStartCommentEdit(reply.id, rTextPart)} className={cn("transition-colors", POPUP_THEME_MAPPING[readerTheme]?.editBtn)}>Sửa</button>
                                              <button onClick={() => handleDeleteComment(reply.id)} className={cn("transition-colors", POPUP_THEME_MAPPING[readerTheme]?.deleteBtn)}>Xóa</button>
                                            </>
                                          )}
                                        </>
                                      )}
                                    </div>

                                    {/* Khung nhập phản hồi con lồng nhau */}
                                    {replyingToId === reply.id && (
                                      <div className="mt-2 flex gap-2 max-w-md items-center animate-in slide-in-from-top-1 duration-150">
                                        <Input
                                          value={replyText}
                                          onChange={(e) => setReplyText(e.target.value)}
                                          placeholder={`Phản hồi ${rRawName}...`}
                                          className={cn("h-8 rounded-full text-xs px-3.5 border focus-visible:ring-0", POPUP_THEME_MAPPING[readerTheme]?.input)}
                                          disabled={isSending}
                                          onKeyDown={(e) => e.key === 'Enter' && handleSendReply(comm.id)}
                                        />
                                        <Button onClick={() => handleSendReply(comm.id)} disabled={isSending || !replyText.trim()} size="sm" className={cn("h-8 rounded-full text-[10px] font-bold px-3", POPUP_THEME_MAPPING[readerTheme]?.sendBtn)}>
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
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-stone-400 italic">Chưa có bình luận nào cho chương này.</div>
        )}
      </div>
    </div>
  )
}