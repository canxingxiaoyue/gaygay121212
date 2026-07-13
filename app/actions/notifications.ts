'use server'

import { sql } from '@vercel/postgres'
import { auth } from '@clerk/nextjs/server'

const ADMIN_ID = process.env.NEXT_PUBLIC_ADMIN_ID

/**
 * LẤY TOÀN BỘ DANH SÁCH THÔNG BÁO (ADMIN HOẶC USER)
 */
export async function getUserNotifications() {
  try {
    const { userId } = await auth()
    if (!userId) return []

    const isAdmin = userId === ADMIN_ID

    // 🌟 ĐÃ SỬA: Sử dụng LEFT JOIN để kết hợp bảng notifications với stories nhằm lấy thêm cột TÊN TRUYỆN (story_title) [MỚI]
    const query = isAdmin 
      ? sql`
          SELECT n.*, s.title AS story_title 
          FROM notifications n
          LEFT JOIN stories s ON n.story_slug = s.slug
          WHERE n.recipient_id = ${userId} OR n.recipient_id = 'ADMIN' 
          ORDER BY n.created_at DESC 
          LIMIT 100
        `
      : sql`
          SELECT n.*, s.title AS story_title 
          FROM notifications n
          LEFT JOIN stories s ON n.story_slug = s.slug
          WHERE n.recipient_id = ${userId} 
          ORDER BY n.created_at DESC 
          LIMIT 100
        `
      
    const { rows } = await query
    return rows
  } catch (error) {
    console.error("Lỗi lấy thông báo hệ thống:", error)
    return []
  }
}

/**
 * ĐÁNH DẤU TẤT CẢ ĐÃ ĐỌC
 */
export async function markNotificationsAsRead() {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false }

    const isAdmin = userId === ADMIN_ID

    if (isAdmin) {
      await sql`UPDATE notifications SET is_read = true WHERE recipient_id = ${userId} OR recipient_id = 'ADMIN'`
    } else {
      await sql`UPDATE notifications SET is_read = true WHERE recipient_id = ${userId}`
    }
    return { success: true }
  } catch (error) {
    return { success: false }
  }
}

/**
 * 🌟 ACTION MỚI: XÓA ĐƠN LẺ MỘT THÔNG BÁO [1]
 */
export async function deleteNotification(id: number) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: 'Chưa đăng nhập!' }

    // Thực hiện xóa thông báo theo ID
    await sql`DELETE FROM notifications WHERE id = ${id}`
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * 🌟 ACTION MỚI: XÓA ĐỒNG LOẠT THÔNG BÁO THEO THÁNG [1]
 * @param monthString Định dạng chuỗi "YYYY-MM" (ví dụ: "2026-06")
 */
export async function deleteNotificationsByMonth(monthString: string) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: 'Chưa đăng nhập!' }

    const isAdmin = userId === ADMIN_ID

    // Trích xuất Năm và Tháng từ chuỗi truyền vào để truy vấn
    const [year, month] = monthString.split('-').map(Number)

    if (isAdmin) {
      // Nếu là admin, xóa thông báo trong tháng của chính họ và thông báo 'ADMIN' chung
      await sql`
        DELETE FROM notifications 
        WHERE (recipient_id = ${userId} OR recipient_id = 'ADMIN')
          AND EXTRACT(YEAR FROM created_at) = ${year}
          AND EXTRACT(MONTH FROM created_at) = ${month}
      `
    } else {
      // Nếu là user thường, chỉ xóa thông báo trong tháng của họ
      await sql`
        DELETE FROM notifications 
        WHERE recipient_id = ${userId}
          AND EXTRACT(YEAR FROM created_at) = ${year}
          AND EXTRACT(MONTH FROM created_at) = ${month}
      `
    }

    return { success: true }
  } catch (error: any) {
    console.error("Lỗi xóa thông báo theo tháng:", error)
    return { success: false, error: error.message }
  }
}