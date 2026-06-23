'use client'

import { useState, useEffect, useRef } from 'react'
import { useUser, RedirectToSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Plus, Upload, BookOpen, ChevronRight, Home, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SiteHeader } from '@/components/site-header'
import { cn } from '@/lib/utils'
import { GENRES } from '@/lib/stories' // Import danh sách thể loại tĩnh mặc định
import { createNewStory, uploadImage, getMergedStories } from '@/app/actions/admin' // Import thêm hàm lấy danh sách gộp

export default function NewStoryPage() {
  const { user, isSignedIn, isLoaded } = useUser()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Các state lưu trữ giá trị form đăng truyện
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [author, setAuthor] = useState('')
  const [cover, setCover] = useState('')
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [chapterCount, setChapterCount] = useState(0)
  const [description, setDescription] = useState('')
  const [link, setLink] = useState('')
  const [tags, setTags] = useState('')

  // Các state để xử lý THỂ LOẠI ĐỘNG và TỰ THÊM TAG MỚI
  const [dynamicGenres, setDynamicGenres] = useState<string[]>(GENRES) // Khởi tạo ban đầu bằng các thể loại tĩnh mặc định
  const [customGenre, setCustomGenre] = useState('') // Ô nhập thể loại mới

  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 1. TỰ ĐỘNG ĐỒNG BỘ TOÀN BỘ CÁC THỂ LOẠI THỰC TẾ ĐANG CÓ TRÊN DATABASE
  useEffect(() => {
    async function load() {
      const allStories = await getMergedStories()
      const dbGenres = allStories.flatMap((s) => s.genres)
      
      // Gộp danh sách tĩnh ban đầu và danh sách động trên database, lọc các giá trị trùng lặp
      const merged = Array.from(new Set([...GENRES, ...dbGenres])).filter(Boolean)
      setDynamicGenres(merged)
    }
    load()
  }, [])

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDF8F1] dark:bg-stone-950">
        <Loader2 className="size-8 animate-spin text-stone-500" />
      </div>
    )
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />
  }

  const isAdmin = user?.id === process.env.NEXT_PUBLIC_ADMIN_ID
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FDF8F1] dark:bg-transparent">
        <SiteHeader />
        <main className="mx-auto w-full max-w-md flex-1 px-4 py-16 flex flex-col items-center justify-center text-center">
          <div className="w-full bg-white dark:bg-card p-8 rounded-3xl border border-stone-200/60 dark:border-stone-800/40 shadow-sm space-y-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/20 mx-auto">
              <ShieldAlert className="size-6 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-serif font-bold text-stone-800 dark:text-stone-100">
              Truy cập bị từ chối!
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              Tài khoản của bạn không có quyền quản trị. Chỉ duy nhất chủ nhà (Admin) mới có quyền đăng truyện mới lên hệ thống.
            </p>
            <Button asChild className="bg-amber-800 hover:bg-amber-700 text-white rounded-xl w-full shadow-sm">
              <Link href="/">Quay lại trang chủ</Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  // Tự gõ thêm thể loại mới
  function handleAddCustomGenre() {
    const val = customGenre.trim()
    if (!val) return

    // 1. Nếu thể loại này chưa có trong danh sách hiển thị, tự động thêm vào
    if (!dynamicGenres.includes(val)) {
      setDynamicGenres((prev) => [...prev, val])
    }
    // 2. Tự động tích chọn thể loại này cho bộ truyện đang tạo
    if (!selectedGenres.includes(val)) {
      setSelectedGenres((prev) => [...prev, val])
    }
    setCustomGenre('') // Xóa trắng ô nhập để gõ tiếp tag khác
  }

  // Tự động tạo slug khi gõ tên truyện (ví dụ: "Huyền Thoại" -> "huyen-thoai")
  function handleTitleChange(val: string) {
    setTitle(val)
    const generatedSlug = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu tiếng Việt
      .replace(/[đĐ]/g, 'd')
      .replace(/([^a-z0-9\s-]+)/g, '')
      .replace(/&/g, '-and-')
      .replace(/[\s-]+/g, '-')
      .replace(/^-+|-+$/g, '')
    setSlug(generatedSlug)
  }

  // Chọn/bỏ chọn thể loại truyện
  function toggleGenre(genre: string) {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    )
  }

  // Tải trực tiếp ảnh bìa từ máy tính lên thư mục public
  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    const res = await uploadImage(formData)
    if (res.success && res.url) {
      setCover(res.url)
    } else {
      alert("Lỗi khi tải ảnh bìa lên: " + res.error)
    }
    setIsUploading(false)
  }

  // Submit gửi lưu truyện lên Postgres
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !slug.trim()) return

    setIsSubmitting(true)
    const res = await createNewStory({
      title,
      slug,
      author: author || 'AAAAAA',
      cover: cover || '/placeholder.svg',
      genres: selectedGenres.join(', '),
      description,
      link,
      tags: tags || selectedGenres.join(', '),
      chapter_count: Number(chapterCount)
    })

    if (res.success) {
      alert("Đăng truyện mới thành công!")
      router.push(`/truyen/${slug}`) // Chuyển hướng ngay về trang chi tiết truyện vừa tạo!
    } else {
      alert("Lỗi khi tạo truyện: " + res.error)
    }
    setIsSubmitting(false)
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FDF8F1] dark:bg-transparent">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <nav className="mb-6 flex items-center gap-1 text-sm text-stone-500">
          <Link href="/" className="flex items-center gap-1 hover:text-stone-800"><Home className="size-3.5" /> Trang chủ</Link>
          <ChevronRight className="size-3.5" />
          <span className="text-stone-800 font-semibold">Thêm truyện mới</span>
        </nav>

        <h1 className="font-serif text-3xl font-bold text-stone-800 dark:text-stone-100 mb-6">Đăng truyện mới lên hệ thống</h1>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-card p-6 rounded-2xl border border-stone-200/60 dark:border-stone-800/40 shadow-sm">
          {/* Tên truyện */}
          <div>
            <label className="text-sm font-semibold text-stone-600 dark:text-stone-400">Tên truyện:</label>
            <Input value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Nhập tên truyện..." required className="mt-1 border-stone-200 dark:border-stone-800" />
          </div>

          {/* Đường dẫn Slug */}
          <div>
            <label className="text-sm font-semibold text-stone-600 dark:text-stone-400">Slug đường dẫn (Tự động sinh ra):</label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="vi-du-ten-truyen" required className="mt-1 bg-stone-50 border-stone-200 dark:border-stone-800 text-stone-500" />
          </div>

          {/* Tác giả */}
          <div>
            <label className="text-sm font-semibold text-stone-600 dark:text-stone-400">Tác giả:</label>
            <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="AAAAA" className="mt-1 border-stone-200 dark:border-stone-800" />
          </div>

          {/* Ảnh bìa */}
          <div>
            <label className="text-sm font-semibold text-stone-600 dark:text-stone-400">Ảnh bìa truyện:</label>
            <div className="flex gap-2 mt-1">
              <Input value={cover} onChange={(e) => setCover(e.target.value)} placeholder="/covers/ten-anh.png hoặc đường dẫn URL..." className="flex-1 border-stone-200 dark:border-stone-800" />
              <input type="file" ref={fileInputRef} onChange={handleCoverUpload} accept="image/*" className="hidden" />
              <Button type="button" variant="outline" disabled={isUploading} onClick={() => fileInputRef.current?.click()} className="text-xs gap-1.5 shrink-0 border-stone-200 dark:border-stone-800">
                {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                Tải ảnh bìa
              </Button>
            </div>
            {cover && (
              <div className="mt-3 relative w-32 aspect-[3/4] rounded-lg overflow-hidden border border-stone-200 dark:border-stone-800 shadow-sm">
                <img src={cover} alt="Bìa preview" className="object-cover w-full h-full" />
              </div>
            )}
          </div>

          {/* Chọn thể loại & Tự tạo thể loại mới */}
          <div>
            <label className="text-sm font-semibold text-stone-600 dark:text-stone-400 block mb-2">Chọn thể loại (Có thể chọn nhiều):</label>
            <div className="flex flex-wrap gap-2">
              {dynamicGenres.map((g) => {
                const active = selectedGenres.includes(g)
                return (
                  <button key={g} type="button" onClick={() => toggleGenre(g)} className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold border transition-all",
                    active 
                      ? "bg-amber-800 border-amber-800 text-white" 
                      : "border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:border-amber-800 hover:text-amber-800"
                  )}>
                    {g}
                  </button>
                )
              })}
            </div>

            {/* Ô NHẬP TỰ ĐĂNG THỂ LOẠI MỚI CỦA ADMIN */}
            <div className="flex gap-2 mt-3 items-center max-w-sm">
              <Input 
                value={customGenre}
                onChange={(e) => setCustomGenre(e.target.value)}
                placeholder="Gõ thể loại mới (Ví dụ: Máu cún, Gương vỡ lại lành...)"
                className="h-8 text-xs rounded-full border-stone-200 dark:border-stone-800 focus-visible:ring-amber-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault() // Chặn hành động gửi form của thẻ Input
                    handleAddCustomGenre()
                  }
                }}
              />
              <Button 
                type="button" 
                size="sm" 
                onClick={handleAddCustomGenre}
                className="h-8 text-xs rounded-full bg-amber-800 hover:bg-amber-700 text-white shrink-0"
              >
                Thêm thể loại mới
              </Button>
            </div>
          </div>

          {/* Số chương ban đầu */}
          <div>
            <label className="text-sm font-semibold text-stone-600 dark:text-stone-400">Số chương ban đầu:</label>
            <Input type="number" min={0} value={chapterCount} onChange={(e) => setChapterCount(Number(e.target.value))} className="mt-1 w-32 border-stone-200 dark:border-stone-800" />
            <p className="text-xs text-stone-400 mt-1">Lưu ý: Hệ thống sẽ tự động khởi tạo danh sách gồm bấy nhiêu chương trắng.</p>
          </div>

          {/* Giới thiệu truyện */}
          <div>
            <label className="text-sm font-semibold text-stone-600 dark:text-stone-400">Giới thiệu truyện:</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Nhập giới thiệu tóm tắt truyện..." className="mt-1 min-h-[120px] border-stone-200 dark:border-stone-800 focus-visible:ring-amber-500" />
          </div>

          {/* Link bản gốc */}
          <div>
            <label className="text-sm font-semibold text-stone-600 dark:text-stone-400">Link bản gốc:</label>
            <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://www.gongzicp.com/..." className="mt-1 border-stone-200 dark:border-stone-800" />
          </div>

          {/* Nút gửi */}
          <div className="flex justify-end gap-2 pt-4">
            <Button asChild variant="ghost" disabled={isSubmitting}>
              <Link href="/">Hủy</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-amber-800 hover:bg-amber-700 text-white">
              {isSubmitting ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Plus className="size-4 mr-1.5" />}
              Tạo truyện mới
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}