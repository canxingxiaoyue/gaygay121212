export interface Chapter {
  number: number
  title: string
  content?: string[]
  isPlaceholder?: boolean // <-- ĐÃ THÊM DÒNG NÀY ĐỂ NHẬN DIỆN CHƯƠNG TRỐNG TRƠN
}

export interface Story {
  slug: string
  title: string
  author: string
  cover: string
  genres: string[]
  status: string
  rating: number
  views: number
  description: string
  link?: string
  tags: string[]
  chapters: Chapter[]
}

export interface OwnerNote {
  id: string
  body: string
}

// 1. DANH SÁCH THỂ LOẠI CHUẨN CỦA QUÁN (ĐÃ THÊM LẠI ĐỂ SỬA TRIỆT ĐỂ LỖI MAP)
export const GENRES = [
  'Nam chủ',
  'Huyền Ảo',
  'Đam mỹ',
  'Cổ đại',
  'Côn trùng',
  'Huyền huyễn',
  'Trinh thám',
  'Đô thị',
  'Hiện đại',
  'Dị thế đại lục',
  'Khoa học viễn tưởng'
]

// 2. DANH SÁCH TRẠNG THÁI CHUẨN
export const STATUSES = [
  'Đang ra',
  'Hoàn thành'
]

// 3. Hàm tạo danh sách chương tự động
export function makeChapters(count: number, customTitles: string[] = []): Chapter[] {
  return Array.from({ length: count }, (_, i) => {
    const num = i + 1
    return {
      number: num,
      title: customTitles[i] || `Chương ${num}`,
    }
  })
}

// 4. DANH SÁCH TRUYỆN: CHỈ GIỮ LẠI DUY NHẤT VÒNG TRÒN ĐỊNH MỆNH
export const STORIES: Story[] = [
  {
    slug: 'vong-tron-dinh-menh',
    title: 'Vòng Tròn Định Mệnh/宿命之环',
    author: 'Mực Thích Lặn Nước/Ái Tiềm Thủy Đích Ô Tặc/爱潜水的乌贼',
    cover: '/covers/vong-tron-dinh-menh.png',
    genres: ['Huyền huyễn', 'Dị thế đại lục'],
    status: 'Đang ra',
    rating: 4.8,
    views: 0,
     description: `Thế giới Quỷ Bí: Phần Hai.

Năm 1368, cuối tháng Bảy, sắc đỏ thẫm sẽ từ trên trời giáng xuống.

Link Qidian: https://www.qidian.com/book/1036370336/`,
    tags: ['Huyền huyễn', 'Dị thế đại lục'],
    chapters: makeChapters(181, ),
  }
]

// 5. Ghi chú từ chủ nhà ở cuối trang chủ
export const OWNER_NOTES: OwnerNote[] = [
  {
    id: '1',
    body: 'Nhà của tớ dùng để chia sẻ tất cả những sở thích của tớ, chủ yếu là truyện niên hạ.'
  }
]

// 6. Hàm lấy thông tin 1 truyện bằng slug
export function getStory(slug: string): Story | undefined {
  return STORIES.find((s) => s.slug === slug)
}

// 7. Hàm rút gọn lượt xem (Ví dụ: 128400 -> 128.4K)
export function formatViews(views: number): string {
  if (views >= 1000000) {
    return (views / 1000000).toFixed(1) + 'M'
  }
  if (views >= 1000) {
    return (views / 1000).toFixed(1) + 'K'
  }
  return views.toString()
}