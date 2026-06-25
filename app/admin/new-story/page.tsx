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

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [author, setAuthor] = useState('')
  const [cover, setCover] = useState('')
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [chapterCount, setChapterCount] = useState(0)
  const [description, setDescription] = useState('')
  const [link, setLink] = useState('')
  const [tags, setTags] = useState('')

  const [dynamicGenres, setDynamicGenres] = useState<string[]>(GENRES)
  const [customGenre, setCustomGenre] = useState('')

  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
            <h2 className="text-xl font-serif font-bold text-stone-800 dark:text-stone-100">Truy cập bị từ chối!</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              Tài khoản của bạn không có quyền quản trị.
            </p>
            <Button asChild className="bg-amber-800 hover:bg-amber-700 text-white rounded-xl w-full shadow-sm">
              <Link href="/">Quay lại trang chủ</Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  function handleAddCustomGenre() {
    const val = customGenre.trim()
    if (!val) return
    if (!dynamicGenres.includes(val)) setDynamicGenres((prev) => [...prev, val])
    if (!selectedGenres.includes(val)) setSelectedGenres((prev) => [...prev, val])
    setCustomGenre('')
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

  function toggleGenre(genre: string) {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    )
  }

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

  // 🌟 HÀM TÁCH RIÊNG ĐỂ XỬ LÝ HTML (Dùng chung cho cả file .html và kết quả giải mã của .docx)
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

  // 🌟 HÀM TIẾP NHẬN TẤT CẢ CÁC ĐỊNH DẠNG FILE (.TXT, .HTML, .DOCX)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError('')
    setIsParsing(true)

    try {
      if (file.name.endsWith('.docx')) {
        // 🌟 NẾU LÀ FILE WORD (.DOCX): Nhờ thư viện Mammoth giải mã thành HTML rồi đưa vào xử lý
        const reader = new FileReader()
        reader.onload = async (event) => {
          try {
            const arrayBuffer = event.target?.result as ArrayBuffer
            const mammoth = await import('mammoth') // Import động siêu nhẹ
            const result = await mammoth.convertToHtml({ arrayBuffer })
            processHtmlContent(result.value) // Tái sử dụng bộ xử lý HTML thông minh
          } catch (err: any) {
            setUploadError('Lỗi đọc file Word: ' + err.message)
            setIsParsing(false)
          }
        }
        reader.onerror = () => { setUploadError('Không thể đọc file'); setIsParsing(false) }
        reader.readAsArrayBuffer(file) // Đọc dưới dạng mã nhị phân

      } else if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
        // 🌟 NẾU LÀ FILE HTML
        const reader = new FileReader()
        reader.onload = (event) => {
          const content = event.target?.result as string
          if (!content) { setUploadError('File trống'); setIsParsing(false); return }
          processHtmlContent(content)
        }
        reader.onerror = () => { setUploadError('Không thể đọc file'); setIsParsing(false) }
        reader.readAsText(file)

      } else if (file.name.endsWith('.txt')) {
        // 🌟 NẾU LÀ FILE TXT
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
      chapter_count: uploadMode === 'file' ? parsedChapters.length : Number(chapterCount),
      chapters: uploadMode === 'file' ? parsedChapters : []
    })

    if (res.success) {
      alert("Đăng truyện mới thành công!")
      router.push(`/truyen/${slug}`)
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
                placeholder="Gõ thể loại mới (Ví dụ: Máu cún...)"
                className="h-8 text-xs rounded-full border-stone-200 dark:border-stone-800 focus-visible:ring-amber-500"
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
                className="h-8 text-xs rounded-full bg-amber-800 hover:bg-amber-700 text-white shrink-0"
              >
                Thêm
              </Button>
            </div>
          </div>

          {/* 🌟 PHƯƠNG THỨC KHỞI TẠO CHƯƠNG TRUYỆN */}
          <div className="space-y-3 pt-4 border-t border-stone-100 dark:border-stone-800">
            <label className="text-sm font-semibold text-stone-600 dark:text-stone-400">Phương thức tạo chương:</label>
            <div className="flex gap-3">
              <Button
                type="button"
                variant={uploadMode === 'blank' ? 'default' : 'outline'}
                onClick={() => setUploadMode('blank')}
                className={cn(
                  "rounded-xl h-9 text-xs font-bold transition-all",
                  uploadMode === 'blank' ? "bg-amber-800 hover:bg-amber-700 text-white border-transparent" : "border-stone-200 dark:border-stone-800"
                )}
              >
                Khởi tạo chương trắng
              </Button>
              <Button
                type="button"
                variant={uploadMode === 'file' ? 'default' : 'outline'}
                onClick={() => setUploadMode('file')}
                className={cn(
                  "rounded-xl h-9 text-xs font-bold transition-all",
                  uploadMode === 'file' ? "bg-amber-800 hover:bg-amber-700 text-white border-transparent" : "border-stone-200 dark:border-stone-800"
                )}
              >
                Đăng chương bằng File (.txt, .html, .docx)
              </Button>
            </div>
          </div>

          {/* GIAO DIỆN THEO LỰA CHỌN KHỞI TẠO CHƯƠNG */}
          {uploadMode === 'blank' ? (
            <div className="animate-fade-in">
              <label className="text-sm font-semibold text-stone-600 dark:text-stone-400">Số chương ban đầu:</label>
              <Input type="number" min={0} value={chapterCount} onChange={(e) => setChapterCount(Number(e.target.value))} className="mt-1 w-32 border-stone-200 dark:border-stone-800" />
            </div>
          ) : (
            <div className="space-y-3 border border-stone-200/60 dark:border-stone-800 rounded-2xl p-4 bg-stone-50/50 dark:bg-stone-900/10 animate-fade-in">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">Tải file truyện chứa chương:</label>
              {/* 🌟 ĐÃ CẬP NHẬT: Mở rộng hỗ trợ đuôi .docx ở thẻ Input */}
              <input
                type="file"
                accept=".txt, .html, .htm, .docx" 
                onChange={handleFileChange}
                className="text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-stone-100 dark:file:bg-stone-800 file:text-stone-800 dark:file:text-stone-300 hover:file:bg-stone-200 cursor-pointer w-full"
              />
              {isParsing && <p className="text-xs text-amber-800 animate-pulse">Đang phân tích cấu trúc file...</p>}
              {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
              {!isParsing && parsedChapters.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-green-600 font-bold">✓ Đã nhận diện thành công {parsedChapters.length} chương từ file!</p>
                  <div className="max-h-36 overflow-y-auto border border-stone-200 dark:border-stone-800 p-2.5 rounded-xl bg-white dark:bg-stone-900 space-y-1">
                    {parsedChapters.slice(0, 5).map((ch, idx) => (
                      <div key={idx} className="text-[11px] text-stone-500 dark:text-stone-400 flex justify-between pr-2">
                        <span className="font-semibold truncate max-w-[75%]">{ch.title}</span>
                        <span className="shrink-0 font-sans">Chương {ch.number}</span>
                      </div>
                    ))}
                    {parsedChapters.length > 5 && (
                      <p className="text-[10px] text-stone-400 text-center italic mt-1.5">... và {parsedChapters.length - 5} chương khác</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

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
            <Button type="submit" disabled={isSubmitting || isParsing} className="bg-amber-800 hover:bg-amber-700 text-white">
              {isSubmitting ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Plus className="size-4 mr-1.5" />}
              Tạo truyện mới
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}