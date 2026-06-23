'use client'

import { useState, useEffect, useMemo } from 'react'
import { Bell, CheckCheck, Trash2, X, Calendar } from 'lucide-react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { getUserNotifications, markNotificationsAsRead, deleteNotification, deleteNotificationsByMonth } from '@/app/actions/notifications'
import { cn } from '@/lib/utils'

export function NotificationBell() {
  const { user, isSignedIn } = useUser()
  const [notifications, setNotifications] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isProcessing, setIsPending] = useState(false)

  const fetchNotifs = async () => {
    if (!isSignedIn || !user) return
    const data = await getUserNotifications()
    setNotifications(data || [])
  }

  useEffect(() => {
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 15000)
    return () => clearInterval(interval)
  }, [isSignedIn, user])

  const unreadCount = notifications.filter(n => !n.is_read).length

  const handleOpen = async () => {
    setIsOpen(!isOpen)
    if (!isOpen && unreadCount > 0 && user) {
      await markNotificationsAsRead()
      setNotifications(notifications.map(n => ({ ...n, is_read: true })))
    }
  }

  // 🌟 1. THUẬT TOÁN PHÂN NHÓM THÔNG BÁO THEO THÁNG/NĂM ĐỂ HIỂN THỊ DẠNG ACCORDION [1]
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, any[]> = {}
    
    notifications.forEach(notif => {
      const date = new Date(notif.created_at)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const key = `${year}-${month}` // Định dạng khóa "2026-06" để xử lý Database [1]
      
      if (!groups[key]) groups[key] = []
      groups[key].push(notif)
    })

    return groups
  }, [notifications])

  // Lấy danh sách các tháng đã được sắp xếp giảm dần (tháng gần nhất lên đầu)
  const sortedMonthKeys = useMemo(() => {
    return Object.keys(groupedNotifications).sort((a, b) => b.localeCompare(a))
  }, [groupedNotifications])

  // 🌟 2. XỬ LÝ XÓA ĐƠN LẺ MỘT THÔNG BÁO [1]
  const handleDeleteSingle = async (e: React.MouseEvent, id: number) => {
    e.preventDefault()
    e.stopPropagation()
    if (isProcessing) return

    setIsPending(true)
    // Cập nhật UI ngay lập tức trong 0ms (Optimistic Update) [1.1.2]
    setNotifications(prev => prev.filter(n => n.id !== id))
    
    try {
      const res = await deleteNotification(id)
      if (!res.success) {
        await fetchNotifs() // Rollback nếu lỗi
        alert("Không thể xóa thông báo: " + res.error)
      }
    } catch (err) {
      await fetchNotifs()
    } finally {
      setIsPending(false)
    }
  }

  // 🌟 3. XỬ LÝ XÓA TOÀN BỘ THÔNG BÁO CỦA MỘT THÁNG [1]
  const handleDeleteMonth = async (e: React.MouseEvent, monthKey: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    const [year, month] = monthKey.split('-')
    if (!confirm(`Bạn có chắc chắn muốn xóa sạch toàn bộ thông báo trong Tháng ${month}/${year} không?`)) {
      return
    }
    if (isProcessing) return

    setIsPending(true)
    // Cập nhật UI ngay lập tức trong 0ms [1.1.2]
    setNotifications(prev => prev.filter(n => {
      const d = new Date(n.created_at)
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      return k !== monthKey
    }))

    try {
      const res = await deleteNotificationsByMonth(monthKey)
      if (!res.success) {
        await fetchNotifs() // Rollback nếu lỗi
        alert("Lỗi khi xóa thông báo theo tháng: " + res.error)
      }
    } catch (err) {
      await fetchNotifs()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="relative">
      {/* Nút Chuông */}
      <button 
        onClick={handleOpen}
        className="relative p-2 text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors rounded-full hover:bg-stone-100 dark:hover:bg-stone-850"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border-2 border-white dark:border-stone-950 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}

      {/* Bảng Dropdown Thông báo */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-92 sm:w-100 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="flex justify-between items-center p-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/50">
            <h3 className="font-serif font-bold text-sm text-stone-800 dark:text-stone-200">Thông báo mới</h3>
            <CheckCheck className="size-4 text-stone-400" />
          </div>

          <div className="max-h-[380px] overflow-y-auto divide-y divide-stone-150 dark:divide-stone-800">
            {sortedMonthKeys.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-stone-400 opacity-70">
                <p className="text-xs italic font-medium">Chưa có thông báo nào dành cho bạn.</p>
              </div>
            ) : (
              sortedMonthKeys.map((monthKey) => {
                const list = groupedNotifications[monthKey]
                const [year, month] = monthKey.split('-')
                
                return (
                  <div key={monthKey} className="space-y-1 bg-stone-50/20 dark:bg-stone-900/10">
                    {/* TIÊU ĐỀ GOM NHÓM THEO THÁNG VÀ NÚT XÓA ĐỒNG LOẠT THÁNG [1] */}
                    <div className="flex justify-between items-center px-4 py-2 bg-stone-100/60 dark:bg-stone-950/40 border-y border-stone-100 dark:border-stone-850 text-stone-500 dark:text-stone-400 text-[11px] font-bold tracking-wider uppercase select-none">
                      <span className="flex items-center gap-1.5 font-serif text-[11.5px]">
                        <Calendar className="size-3.5 text-amber-800 dark:text-amber-500" />
                        Tháng {month} / {year} ({list.length})
                      </span>
                      {/* Nút xóa đồng loạt thông báo của tháng [1] */}
                      <button 
                        onClick={(e) => handleDeleteMonth(e, monthKey)}
                        className="flex items-center gap-1 text-red-500 hover:text-red-600 transition-colors uppercase text-[9px] font-bold bg-red-500/10 hover:bg-red-500/20 px-2 py-0.5 rounded-full"
                        title={`Xóa sạch tất cả thông báo trong tháng ${month}`}
                      >
                        <Trash2 className="size-3" /> Xóa tháng
                      </button>
                    </div>

                    {/* Danh sách thông báo lẻ trong tháng */}
                    <div className="divide-y divide-stone-100/50 dark:divide-stone-850/40">
                      {list.map((notif) => {
                        const isUnread = !notif.is_read
                        const safeName = notif?.sender_name || 'Độc giả ẩn danh'
                        
                        return (
                          <div 
                            key={notif.id}
                            className={cn(
                              "group flex gap-3 p-3 transition-colors hover:bg-stone-50 dark:hover:bg-stone-800/40 relative text-left",
                              isUnread ? "bg-amber-50/20 dark:bg-stone-850/50" : ""
                            )}
                          >
                            <Link 
                              href={notif.target_link || `/truyen/${notif.story_slug}/${notif.chapter_number}`}
                              onClick={() => setIsOpen(false)}
                              className="flex gap-3 flex-1"
                            >
                              {notif.sender_avatar ? (
                                <img src={notif.sender_avatar} alt="Avatar" className="size-9 rounded-full object-cover shrink-0 border" />
                              ) : (
                                <div className="size-9 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center font-bold text-stone-500 shrink-0 text-xs">
                                  {safeName.charAt(0).toUpperCase()}
                                </div>
                              )}

                              <div className="flex-1 space-y-1 pr-6">
                                <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                                  <span className="font-bold text-stone-900 dark:text-stone-100">{safeName}</span>
                                  {notif.type === 'REPLY' && ' đã phản hồi bình luận của bạn trong '}
                                  {notif.type === 'NEW_COMMENT' && ' đã để lại lời bình luận trong '}
                                  {notif.type === 'new_chapter' && ' vừa cập nhật thêm chương mới: '}
                                  {notif.type === 'new_story' && ' - Truyện mới ra lò: '}
                                  <span className="font-semibold text-amber-800 dark:text-amber-500">Chương {notif.chapter_number}</span>.
                                </p>
                                {notif.preview_text && (
                                  <p className="text-[11px] text-stone-500 dark:text-stone-400 italic line-clamp-1 border-l-2 border-stone-200 dark:border-stone-700 pl-2">
                                    "{notif.preview_text}"
                                  </p>
                                )}
                                <p className="text-[9px] text-stone-400 font-medium">
                                  {new Date(notif.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(notif.created_at).toLocaleDateString('vi-VN')}
                                </p>
                              </div>
                            </Link>

                            {/* NÚT XÓA RIÊNG LẺ THÔNG BÁO (Xuất hiện mượt mà khi Hover) [1] */}
                            <button
                              onClick={(e) => handleDeleteSingle(e, notif.id)}
                              className="absolute top-3 right-3 text-stone-400 hover:text-red-500 transition-all duration-200 p-1 hover:bg-stone-200/50 dark:hover:bg-stone-800 rounded-full opacity-0 group-hover:opacity-100"
                              title="Xóa thông báo này"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}