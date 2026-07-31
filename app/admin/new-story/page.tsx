'use client'

import { useState, useEffect, useRef } from 'react'
import { useUser, RedirectToSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Plus, Upload, BookOpen, ChevronRight, Home, ShieldAlert, BookHeart, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SiteHeader } from '@/components/site-header'
import { cn } from '@/lib/utils'
import { GENRES } from '@/lib/stories'
import { createNewStory, uploadImage, getMergedStories } from '@/app/actions/admin'

interface ParsedChapter {
  number: number
  title: string
  content: string
}

export default function NewStoryPage() {
  const { user, isSignedIn, isLoaded } = useUser()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // STATE CƠ BẢN
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [author, setAuthor] = useState('')
  const [cover, setCover] = useState('')
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [chapterCount, setChapterCount] = useState(0)
  const [description, setDescription] = useState('')
  const [link, setLink] = useState('')
  const [tags, setTags] = useState('')

  // 🌟 STATE MẬT KHẨU BẢO VỆ TRUYỆN
  const [password, setPassword] = useState('')

  // STATE TÙY CHỈNH THỂ LOẠI
  const [dynamicGenres, setDynamicGenres] = useState<string[]>(GENRES)
  const [customGenre, setCustomGenre] = useState('')

  // STATE PHÂN LOẠI TRUYỆN
  const [storyType, setStoryType] = useState<'original' | 'fanfic'>('original')
  const [fandomName, setFandomName] = useState('')
  const [shipdomName, setShipdomName] = useState('')

  // STATE HỆ THỐNG
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // STATE PHƯƠNG THỨC TẠO CHƯƠNG & UPLOAD FILE
  const [uploadMode, setUploadMode] = useState<'blank' | 'file'>('blank')
  const [parsedChapters, setParsedChapters] = useState<ParsedChapter[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const [uploadError, setUploadError] = useState('')

  useEffect(() => {
    async function load() {
      const allStories = await getMergedStories()
      const dbGenres = allStories.flatMap((s) => s.genres)
      const merged = Array.from(new Set([...GENRES, ...dbGenres])).filter(Boolean)
      setDynamicGenres(merged)
    }
    load()
  }, [])

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDF8F1] dark:bg-stone-950">
        <Loader2 className="size-8 animate-spin text-[#A45C12]" />
      </div>
    )
  }

  if (!isSignedIn) return <RedirectToSignIn />

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
            <h2 className="text-xl font-serif font-bold text-stone-800 dark:text-stone-100">Truy cập bị từ chối!</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400">Tài khoản của bạn không có quyền quản trị.</p>
            <Button asChild className="bg-[#A45C12] hover:bg-[#8A490F] text-white rounded-xl w-full shadow-sm">
              <Link href="/">Quay lại trang chủ</Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  function handleTitleChange(val: string) {
    setTitle(val)
    const generatedSlug = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/([^a-z0-9\s-]+)/g, '')
      .replace(/&/g, '-and-')
      .replace(/[\s-]+/g, '-')
      .replace(/^-+|-+$/g, '')
    setSlug(generatedSlug)
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    const res = await uploadImage(formData)
    if (res.success && res.url) setCover(res.url)
    else alert("Lỗi khi tải ảnh bìa lên: " + res.error)
    setIsUploading(false)
  }

  function toggleGenre(genre: string) {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    )
  }

  function handleAddCustomGenre() {
    const val = customGenre.trim()
    if (!val) return
    if (!dynamicGenres.includes(val)) setDynamicGenres((prev) => [...prev, val])
    if (!selectedGenres.includes(val)) setSelectedGenres((prev) => [...prev, val])
    setCustomGenre('')
  }

  const processHtmlContent = (htmlString: string) => {
    try {
      const normalizedContent = htmlString.replace(/<br\s*\/?>/gi, '</p><p>')
      const parser = new DOMParser()
      const doc = parser.parseFromString(normalizedContent, 'text/html')
      
      const chapters: ParsedChapter[] = []
      let chapterCounter = 1
      let currentChapter: ParsedChapter | null = null

      const elements = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, p'))

      elements.forEach((node) => {
        const el = node as HTMLElement
        const tagName = el.tagName.toLowerCase()
        const text = el.textContent?.trim() || ''

        const isHeading = ['h1', 'h2', 'h3', 'h4', 'h5'].includes(tagName) ||
                          (['p', 'div'].includes(tagName) && (
                            text.startsWith('[AllKlein]') || 
                            text.startsWith('[Chúa Tể') || 
                            /^Chương\s+\d+/i.test(text)
                          ) && text.length < 100)

        if (isHeading) {
          if (currentChapter) chapters.push(currentChapter)

          let finalTitle = text
          let extraContent = ''
          if (text.length > 100) {
            const lines = text.split('\n')
            finalTitle = lines[0].trim()
            extraContent = lines.slice(1).map(l => l.trim() !== '' ? `<p>${l.trim()}</p>` : '').filter(Boolean).join('\n')
          }

          currentChapter = {
            number: chapterCounter++,
            title: finalTitle || `Chương ${chapterCounter}`,
            content: extraContent ? extraContent + '\n' : ''
          }
        } else if (tagName === 'p') {
          if (currentChapter && el.innerHTML.trim() !== '') {
            currentChapter.content += `<p>${el.innerHTML.trim()}</p>\n`
          }
        }
      })

      if (currentChapter) chapters.push(currentChapter)
      setParsedChapters(chapters)
    } catch (err: any) {
      setUploadError('Lỗi phân tích nội dung HTML: ' + err.message)
    } finally {
      setIsParsing(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError('')
    setIsParsing(true)

    try {
      if (file.name.endsWith('.docx')) {
        const reader = new FileReader()
        reader.onload = async (event) => {
          try {
            const arrayBuffer = event.target?.result as ArrayBuffer
            const mammoth = await import('mammoth')
            const result = await mammoth.convertToHtml({ arrayBuffer })
            processHtmlContent(result.value)
          } catch (err: any) {
            setUploadError('Lỗi đọc file Word: ' + err.message)
            setIsParsing(false)
          }
        }
        reader.onerror = () => { setUploadError('Không thể đọc file'); setIsParsing(false) }
        reader.readAsArrayBuffer(file)

      } else if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const content = event.target?.result as string
          if (!content) { setUploadError('File trống'); setIsParsing(false); return }
          processHtmlContent(content)
        }
        reader.onerror = () => { setUploadError('Không thể đọc file'); setIsParsing(false) }
        reader.readAsText(file)

      } else if (file.name.endsWith('.txt')) {
        const reader = new FileReader()
        reader.onload = (event) => {
          try {
            const content = event.target?.result as string
            if (!content) throw new Error('File trống')
            
            const lines = content.split('\n')
            let chapterCounter = 1
            let currentChapter: ParsedChapter | null = null
            const chapters: ParsedChapter[] = []

            lines.forEach((line) => {
              const trimmed = line.trim()
              if (!trimmed) return

              const isHeading = (trimmed.startsWith('[AllKlein]') || 
                                trimmed.startsWith('[Chúa Tể') || 
                                /^Chương\s+\d+/i.test(trimmed)) && trimmed.length < 100

              if (isHeading) {
                if (currentChapter) chapters.push(currentChapter)
                currentChapter = { number: chapterCounter++, title: trimmed || `Chương ${chapterCounter}`, content: '' }
              } else {
                if (currentChapter) currentChapter.content += `<p>${trimmed}</p>\n`
              }
            })
            if (currentChapter) chapters.push(currentChapter)
            setParsedChapters(chapters)
          } catch (err: any) {
            setUploadError('Lỗi phân tích file: ' + err.message)
          } finally {
            setIsParsing(false)
          }
        }
        reader.onerror = () => { setUploadError('Không thể đọc file'); setIsParsing(false) }
        reader.readAsText(file)
      } else {
        setUploadError('Định dạng file không được hỗ trợ. Vui lòng chọn .txt, .html hoặc .docx')
        setIsParsing(false)
      }
    } catch (err: any) {
      setUploadError('Lỗi hệ thống: ' + err.message)
      setIsParsing(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !slug.trim()) {
      alert("Tên truyện và Slug là bắt buộc!")
      return
    }

    setIsSubmitting(true)

    try {
      let finalGenresList = [...selectedGenres]

      if (storyType === 'fanfic') {
        finalGenresList.push('Fanfic')
        
        if (fandomName.trim()) {
          const fandoms = fandomName.split(',').map(s => s.trim()).filter(Boolean)
          finalGenresList.push(...fandoms)
        }
        
        if (shipdomName.trim()) {
          const shipdoms = shipdomName.split(',').map(s => s.trim()).filter(Boolean)
          finalGenresList.push(...shipdoms)
        }
      }

      finalGenresList = Array.from(new Set(finalGenresList))
      const finalGenresString = finalGenresList.join(', ')

      const res = await createNewStory({
        title: title.trim(),
        slug: slug.trim(),
        author: author.trim() || 'Ẩn danh',
        cover: cover.trim() || '/placeholder.svg',
        genres: finalGenresString,
        description: description.trim(),
        link: link.trim(),
        tags: tags.trim() || finalGenresString,
        password: password.trim(), // 🌟 GỬI MẬT KHẨU
        chapter_count: uploadMode === 'file' ? parsedChapters.length : Number(chapterCount),
        chapters: uploadMode === 'file' ? parsedChapters : []
      })

      if (res.success) {
        alert("Đăng truyện mới thành công!")
        router.push(`/truyen/${slug.trim()}`)
      } else {
        alert("Lỗi khi tạo truyện: " + res.error)
      }
    } catch (err: any) {
      alert("Đã xảy ra lỗi: " + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FDF8F1] dark:bg-[#1A1615] font-sans">
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1 text-sm text-stone-500">
          <Link href="/" className="flex items-center gap-1 hover:text-[#8B5E3C]">
            <Home className="size-3.5" /> Trang chủ
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="text-stone-800 dark:text-stone-200 font-semibold">Thêm truyện mới</span>
        </nav>

        <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#5C3D2E] dark:text-[#EADBC8] mb-8">
          Đăng truyện mới lên hệ thống
        </h1>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#241D18] p-6 sm:p-8 rounded-[28px] shadow-[0_8px_30px_rgba(80,50,20,0.06)] border border-[#F2E8DC] dark:border-white/10 space-y-7">
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#5A3823] dark:text-[#E9D7C3]">Tên truyện:</label>
            <Input 
              value={title} 
              onChange={(e) => handleTitleChange(e.target.value)} 
              placeholder="Nhập tên truyện..." 
              required
              className="h-11 rounded-xl bg-stone-50/50 dark:bg-[#1A1615] border-[#EEDFD0] dark:border-white/10 focus:border-[#D89A52] focus:ring-[#D89A52]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-[#5A3823] dark:text-[#E9D7C3]">Slug đường dẫn (Tự động sinh ra):</label>
            <Input 
              value={slug} 
              onChange={(e) => setSlug(e.target.value)} 
              placeholder="vi-du-ten-truyen" 
              required
              className="h-11 rounded-xl bg-stone-50/50 dark:bg-[#1A1615] border-[#EEDFD0] dark:border-white/10 text-stone-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-[#5A3823] dark:text-[#E9D7C3]">Tác giả:</label>
            <Input 
              value={author} 
              onChange={(e) => setAuthor(e.target.value)} 
              placeholder="AAAAA" 
              className="h-11 rounded-xl bg-stone-50/50 dark:bg-[#1A1615] border-[#EEDFD0] dark:border-white/10"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-[#5A3823] dark:text-[#E9D7C3]">Ảnh bìa truyện:</label>
            <div className="flex gap-2 mt-1">
              <Input 
                value={cover} 
                onChange={(e) => setCover(e.target.value)} 
                placeholder="/covers/ten-anh.png hoặc đường dẫn URL..." 
                className="flex-1 h-11 rounded-xl bg-stone-50/50 dark:bg-[#1A1615] border-[#EEDFD0] dark:border-white/10"
              />
              <input type="file" ref={fileInputRef} onChange={handleCoverUpload} accept="image/*" className="hidden" />
              <Button type="button" variant="outline" disabled={isUploading} onClick={() => fileInputRef.current?.click()} className="h-11 rounded-xl border-[#EEDFD0] dark:border-white/10 hover:bg-[#FFF4E7] dark:hover:bg-[#3D2D23] text-[#A45C12] dark:text-[#F4C27A] shrink-0">
                {isUploading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Upload className="size-4 mr-2" />}
                Tải ảnh bìa
              </Button>
            </div>
            {cover && (
              <div className="mt-3 relative w-32 aspect-[3/4] rounded-lg overflow-hidden border border-stone-200 shadow-sm">
                <img src={cover} alt="Bìa preview" className="object-cover w-full h-full" />
              </div>
            )}
          </div>

          {/* 🌟 Ô NHẬP MẬT KHẨU BẢO VỆ TRUYỆN (NẾU CÓ) */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#5A3823] dark:text-[#E9D7C3] flex items-center gap-1.5">
              <Lock className="size-4 text-[#A45C12]" /> Mật khẩu bảo vệ truyện (Nếu có):
            </label>
            <Input 
              type="text"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Ví dụ: leoklein (Để trống nếu không đặt pass)..." 
              className="h-11 rounded-xl bg-stone-50/50 dark:bg-[#1A1615] border-[#EEDFD0] dark:border-white/10 font-semibold"
            />
          </div>

          {/* PHÂN LOẠI TRUYỆN: NGUYÊN TÁC / FANFIC */}
          <div className="space-y-3 pt-2">
            <label className="text-sm font-bold text-[#5A3823] dark:text-[#E9D7C3]">Loại truyện:</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStoryType('original')}
                className={cn(
                  "flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold transition-all border",
                  storyType === 'original'
                    ? "bg-[#A45C12] text-white border-[#A45C12] shadow-sm"
                    : "bg-white dark:bg-[#1A1615] border-[#EEDFD0] dark:border-white/10 text-stone-600 dark:text-stone-400 hover:border-[#D89A52]"
                )}
              >
                <BookOpen className="size-4" /> Truyện Nguyên tác
              </button>
              <button
                type="button"
                onClick={() => setStoryType('fanfic')}
                className={cn(
                  "flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold transition-all border",
                  storyType === 'fanfic'
                    ? "bg-gradient-to-r from-[#F4C27A] to-[#D89A52] text-white border-[#D89A52] shadow-sm"
                    : "bg-white dark:bg-[#1A1615] border-[#EEDFD0] dark:border-white/10 text-stone-600 dark:text-stone-400 hover:border-[#D89A52]"
                )}
              >
                <BookHeart className="size-4" /> Fanfic / Đồng nhân
              </button>
            </div>
          </div>

          {/* FORM ĐIỀN THÔNG TIN FANFIC ĐỘNG */}
          {storyType === 'fanfic' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-[20px] bg-[#FFF9F4] dark:bg-[#31261F] border border-[#EEDFD0] dark:border-white/10 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#A45C12] dark:text-[#F4C27A] uppercase tracking-wider">Tên Fandom:</label>
                <Input 
                  value={fandomName} 
                  onChange={(e) => setFandomName(e.target.value)} 
                  placeholder="Ví dụ: Chúa Tể Quỷ Bí, Harry Potter..." 
                  className="h-10 rounded-xl bg-white dark:bg-[#241D18] border-stone-200 dark:border-stone-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#A45C12] dark:text-[#F4C27A] uppercase tracking-wider">Tên Shipdom (Nếu có):</label>
                <Input 
                  value={shipdomName} 
                  onChange={(e) => setShipdomName(e.target.value)} 
                  placeholder="Ví dụ: AllKlein, Leoklein..." 
                  className="h-10 rounded-xl bg-white dark:bg-[#241D18] border-stone-200 dark:border-stone-800"
                />
              </div>
            </div>
          )}

          {/* CHỌN THỂ LOẠI */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-[#5A3823] dark:text-[#E9D7C3] block mb-2">Chọn thể loại chung (Có thể chọn nhiều):</label>
            <div className="flex flex-wrap gap-2">
              {dynamicGenres.map((g) => {
                const active = selectedGenres.includes(g)
                return (
                  <button key={g} type="button" onClick={() => toggleGenre(g)} className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-semibold border transition-all",
                    active 
                      ? "bg-[#8B5E3C] text-white border-[#8B5E3C]" 
                      : "bg-white dark:bg-[#1A1615] border-[#EEDFD0] dark:border-white/10 text-stone-600 dark:text-stone-300 hover:border-[#D89A52] hover:text-[#A45C12]"
                  )}>
                    {g}
                  </button>
                )
              })}
            </div>

            <div className="flex gap-2 max-w-sm mt-3 items-center">
              <Input 
                value={customGenre}
                onChange={(e) => setCustomGenre(e.target.value)}
                placeholder="Gõ thể loại mới (Ví dụ: Ngọt sủng...)"
                className="h-9 rounded-full bg-stone-50/50 dark:bg-[#1A1615] text-xs border-[#EEDFD0] dark:border-white/10 focus-visible:ring-[#D89A52]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault() 
                    handleAddCustomGenre()
                  }
                }}
              />
              <Button 
                type="button" 
                size="sm" 
                onClick={handleAddCustomGenre}
                className="h-9 rounded-full bg-[#A45C12] hover:bg-[#8A490F] text-white text-xs shrink-0 px-4"
              >
                Thêm
              </Button>
            </div>
          </div>

          {/* PHƯƠNG THỨC KHỞI TẠO CHƯƠNG VÀ UPLOAD FILE */}
          <div className="space-y-4 pt-5 border-t border-[#F6EBDD] dark:border-white/10">
            <label className="text-sm font-bold text-[#5A3823] dark:text-[#E9D7C3]">Phương thức tạo chương:</label>
            <div className="flex gap-3">
              <Button
                type="button"
                variant={uploadMode === 'blank' ? 'default' : 'outline'}
                onClick={() => setUploadMode('blank')}
                className={cn(
                  "rounded-xl h-10 text-xs sm:text-sm font-bold transition-all",
                  uploadMode === 'blank' ? "bg-[#8B5E3C] hover:bg-[#5C3D2E] text-white border-transparent" : "bg-white dark:bg-[#1A1615] border-[#EEDFD0] dark:border-white/10 text-stone-600 hover:border-[#D89A52] hover:text-[#A45C12]"
                )}
              >
                Khởi tạo chương trắng
              </Button>
              <Button
                type="button"
                variant={uploadMode === 'file' ? 'default' : 'outline'}
                onClick={() => setUploadMode('file')}
                className={cn(
                  "rounded-xl h-10 text-xs sm:text-sm font-bold transition-all",
                  uploadMode === 'file' ? "bg-[#8B5E3C] hover:bg-[#5C3D2E] text-white border-transparent" : "bg-white dark:bg-[#1A1615] border-[#EEDFD0] dark:border-white/10 text-stone-600 hover:border-[#D89A52] hover:text-[#A45C12]"
                )}
              >
                Đăng chương bằng File (.txt, .html, .docx)
              </Button>
            </div>

            {/* GIAO DIỆN THEO LỰA CHỌN KHỞI TẠO CHƯƠNG */}
            {uploadMode === 'blank' ? (
              <div className="animate-fade-in flex items-center gap-3">
                <label className="text-sm font-bold text-stone-700 dark:text-stone-300">Số chương ban đầu:</label>
                <Input 
                  type="number" 
                  min={0} 
                  value={chapterCount} 
                  onChange={(e) => setChapterCount(Number(e.target.value))} 
                  className="h-11 w-24 rounded-xl bg-stone-50/50 dark:bg-[#1A1615] border-[#EEDFD0] dark:border-white/10 text-center font-bold text-lg text-[#A45C12]" 
                />
              </div>
            ) : (
              <div className="space-y-3 border border-[#EEDFD0] dark:border-white/10 rounded-2xl p-5 bg-[#FFFDFB] dark:bg-[#1A1615] shadow-inner animate-fade-in">
                <label className="text-xs font-bold text-[#9B8C80] uppercase tracking-wide">Tải file truyện chứa chương:</label>
                <input
                  type="file"
                  accept=".txt, .html, .htm, .docx" 
                  onChange={handleFileChange}
                  className="text-sm text-stone-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#F4EEE6] dark:file:bg-[#3D2D23] file:text-[#8B5E3C] dark:file:text-[#F4C27A] hover:file:bg-[#EADBC8] dark:hover:file:bg-[#5C3D2E] cursor-pointer w-full transition-colors"
                />
                
                {isParsing && <p className="text-xs text-amber-600 font-bold animate-pulse mt-2 flex items-center gap-1.5"><Loader2 className="size-3.5 animate-spin" /> Đang phân tích cấu trúc file...</p>}
                {uploadError && <p className="text-xs text-rose-500 font-bold mt-2">{uploadError}</p>}
                
                {!isParsing && parsedChapters.length > 0 && (
                  <div className="space-y-2 mt-3">
                    <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">✓ Đã nhận diện thành công {parsedChapters.length} chương từ file!</p>
                    <div className="max-h-48 overflow-y-auto border border-[#EEDFD0] dark:border-white/10 p-3 rounded-xl bg-white dark:bg-[#241D18] space-y-1 shadow-sm">
                      {parsedChapters.slice(0, 5).map((ch, idx) => (
                        <div key={idx} className="text-[12px] text-stone-600 dark:text-[#E9D7C3] flex justify-between pr-2 border-b border-stone-50 dark:border-stone-800 last:border-0 py-1.5">
                          <span className="font-semibold truncate max-w-[75%]">{ch.title}</span>
                          <span className="shrink-0 font-sans text-stone-400">Chương {ch.number}</span>
                        </div>
                      ))}
                      {parsedChapters.length > 5 && (
                        <p className="text-[11px] text-stone-400 text-center italic pt-2">... và {parsedChapters.length - 5} chương khác</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-[#5A3823] dark:text-[#E9D7C3]">Giới thiệu truyện:</label>
            <Textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Nhập giới thiệu tóm tắt truyện..." 
              className="mt-1 min-h-[120px] rounded-xl bg-stone-50/50 dark:bg-[#1A1615] border-[#EEDFD0] dark:border-white/10 p-4 focus-visible:ring-[#D89A52]" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-[#5A3823] dark:text-[#E9D7C3]">Link bản gốc (Nếu có):</label>
            <Input 
              value={link} 
              onChange={(e) => setLink(e.target.value)} 
              placeholder="https://..." 
              className="h-11 rounded-xl bg-stone-50/50 dark:bg-[#1A1615] border-[#EEDFD0] dark:border-white/10 focus:border-[#D89A52]" 
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-[#F6EBDD] dark:border-white/10 mt-6 pt-6">
            <Button asChild variant="ghost" disabled={isSubmitting || isParsing} className="h-11 px-6 rounded-full font-semibold text-stone-500 hover:text-stone-800">
              <Link href="/">Hủy</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting || isParsing} className="h-11 px-8 rounded-full bg-gradient-to-r from-[#F4C27A] to-[#D89A52] hover:opacity-90 text-white font-bold text-sm shadow-md transition-all active:scale-95 border border-[#D89A52]">
              {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
              {isSubmitting ? 'Đang tạo truyện...' : 'Đăng truyện ngay'}
            </Button>
          </div>

        </form>
      </main>
    </div>
  )
}