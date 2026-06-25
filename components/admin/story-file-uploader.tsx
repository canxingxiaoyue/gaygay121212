'use client'

import { useState } from 'react'
import { UploadCloud, FileText, CheckCircle, Loader2, AlertCircle, FileCode2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uploadChaptersFromText } from '@/app/actions/admin' // 🌟 Import hàm lưu database

interface ParsedChapter {
  number: number
  title: string
  content: string
}

export function StoryFileUploader({ storyId }: { storyId: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [parsedChapters, setParsedChapters] = useState<ParsedChapter[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')

  // Chấp nhận cả file .txt và .html
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && (selectedFile.name.endsWith('.txt') || selectedFile.name.endsWith('.html') || selectedFile.name.endsWith('.htm'))) {
      setFile(selectedFile)
      setError('')
      
      // Phân loại xử lý theo đuôi file
      if (selectedFile.name.endsWith('.html') || selectedFile.name.endsWith('.htm')) {
        parseHtmlFile(selectedFile)
      } else {
        parseTxtFile(selectedFile)
      }
    } else {
      setError('Vui lòng chọn file định dạng .txt hoặc .html')
      setFile(null)
      setParsedChapters([])
    }
  }

  // 🌟 ĐÃ SỬA: XỬ LÝ FILE HTML (PHÒNG VỆ CHỐNG LỒNG THẺ & TỰ ĐỘNG CHUẨN HÓA <BR>)
  const parseHtmlFile = (file: File) => {
    setIsParsing(true)
    const reader = new FileReader()

    reader.onload = (e) => {
      let htmlString = e.target?.result as string
      if (!htmlString) {
        setIsParsing(false)
        return
      }

      // 🌟 GIẢI PHÁP 1: Tự động biến đổi tất cả các thẻ xuống dòng <br> thành </p><p> để tách dòng,
      // giúp các dòng text lồng nhau không bị dính liền và bóc tách chuẩn xác thành từng đoạn văn độc lập
      htmlString = htmlString.replace(/<br\s*\/?>/gi, '</p><p>')

      const parser = new DOMParser()
      const doc = parser.parseFromString(htmlString, 'text/html')

      const chapters: ParsedChapter[] = []
      let currentChapter: ParsedChapter | null = null
      let chapterCounter = 1 // Tự động đếm số chương

      // Tìm trực tiếp các tiêu đề và đoạn văn p
      const elements = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, p'))

      if (elements.length === 0) {
        setError('Không tìm thấy bất kỳ thẻ tiêu đề (h1, h2...) hoặc đoạn văn nào trong file!')
        setIsParsing(false)
        return
      }

      elements.forEach((node) => {
        const el = node as HTMLElement
        const tagName = el.tagName.toLowerCase()

        // Nhận diện thẻ tiêu đề chương 
        // (🌟 GIẢI PHÁP 2: Thêm giới hạn < 100 ký tự để tránh việc nuốt cả đoạn văn dài làm tiêu đề)
        const isHeading = ['h1', 'h2', 'h3', 'h4', 'h5'].includes(tagName) || 
                          (tagName === 'p' && el.innerHTML.includes('<strong>[AllKlein]') && (el.textContent?.trim().length || 0) < 100)

        if (isHeading) {
          // Đã tìm thấy một tiêu đề chương mới! Lưu lại chương trước đó (nếu có dữ liệu)
          if (currentChapter) {
            chapters.push(currentChapter)
          }

          const rawText = el.textContent?.trim() || ''
          let finalTitle = rawText
          let extraContent = ''

          // 🌟 GIẢI PHÁP 3: PHÒNG VỆ NÂNG CAO - Nếu tiêu đề bị quá dài (do lỗi lồng thẻ trong HTML gốc),
          // Chỉ lấy dòng đầu tiên làm Tên chương, phần văn bản bị nuốt phía sau sẽ tự động chuyển thành Nội dung chương!
          if (rawText.length > 100) {
            const lines = rawText.split('\n')
            finalTitle = lines[0].trim()
            extraContent = lines.slice(1).map(l => l.trim() !== '' ? `<p>${l.trim()}</p>` : '').filter(Boolean).join('\n')
          }

          // Tạo chương mới
          currentChapter = {
            number: chapterCounter++,
            title: finalTitle || `Chương ${chapterCounter}`,
            content: extraContent ? extraContent + '\n' : ''
          }
        } else if (tagName === 'p') {
          // Cộng dồn nội dung vào chương hiện tại
          if (currentChapter && el.innerHTML.trim() !== '') {
            currentChapter.content += `<p>${el.innerHTML.trim()}</p>\n`
          }
        }
      })

      // Đẩy chương cuối cùng vào mảng
      if (currentChapter) {
        chapters.push(currentChapter)
      }

      setParsedChapters(chapters)
      setIsParsing(false)
    }

    reader.readAsText(file)
  }

  // HÀM CŨ: XỬ LÝ FILE TXT
  const parseTxtFile = (file: File) => {
    setIsParsing(true)
    const reader = new FileReader()

    reader.onload = (e) => {
      const text = e.target?.result as string
      if (!text) return

      const lines = text.split('\n')
      const chapters: ParsedChapter[] = []
      
      let currentChapterNumber = 0
      let currentChapterTitle = ''
      let currentContent: string[] = []

      const chapterRegex = /^Chương\s+(\d+)[\s:\-]*([^\n\r]*)/i

      lines.forEach((line) => {
        const match = line.match(chapterRegex)

        if (match) {
          if (currentChapterNumber > 0 && currentContent.length > 0) {
            chapters.push({
              number: currentChapterNumber,
              title: currentChapterTitle || `Chương ${currentChapterNumber}`,
              content: currentContent.join('\n').trim()
            })
          }
          currentChapterNumber = parseInt(match[1], 10)
          currentChapterTitle = match[2] ? match[2].trim() : `Chương ${currentChapterNumber}`
          currentContent = []
        } else {
          if (currentChapterNumber > 0 && line.trim() !== '') {
            currentContent.push(`<p>${line.trim()}</p>`) 
          }
        }
      })

      if (currentChapterNumber > 0 && currentContent.length > 0) {
        chapters.push({
          number: currentChapterNumber,
          title: currentChapterTitle || `Chương ${currentChapterNumber}`,
          content: currentContent.join('\n').trim()
        })
      }

      setParsedChapters(chapters)
      setIsParsing(false)
    }

    reader.readAsText(file)
  }

  // 🌟 ĐÃ SỬA: Thực hiện gọi Server Action lưu trực tiếp vào Postgres
  const handleSaveToDatabase = async () => {
    if (parsedChapters.length === 0) return
    setIsUploading(true)
    
    try {
      // Gọi Server Action thực tế để lưu hàng loạt chương
      const res = await uploadChaptersFromText(storyId, parsedChapters)
      
      if (res.success) {
        alert(`Đã lưu thành công toàn bộ ${parsedChapters.length} chương truyện vào hệ thống!`)
        setFile(null)
        setParsedChapters([])
        // Tải lại trang để cập nhật giao diện đọc truyện mới
        window.location.reload()
      } else {
        alert(`Lỗi khi lưu chương: ${res.error}`)
      }
    } catch (err) {
      alert('Đã xảy ra sự cố trong quá trình lưu dữ liệu!')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold font-serif text-[#5C3D2E] dark:text-[#EADBC8]">Nhập truyện từ File</h2>
        <p className="text-sm text-stone-500 mt-1">Hỗ trợ file <span className="font-bold text-[#8B5E3C]">.txt</span> và <span className="font-bold text-[#8B5E3C]">.html</span></p>
      </div>

      {/* Khu vực chọn file */}
      <div className="relative border-2 border-dashed border-[#E5D8C8] dark:border-stone-700 rounded-xl p-8 hover:bg-[#FBF9F6] dark:hover:bg-stone-800/50 transition flex flex-col items-center justify-center text-center cursor-pointer group bg-[#FFFDFB] dark:bg-stone-950">
        <input 
          type="file" 
          accept=".txt, .html, .htm" 
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex gap-2 mb-3">
            <FileText className="size-10 text-[#8B5E3C] dark:text-stone-400 group-hover:-rotate-6 transition duration-300" />
            <FileCode2 className="size-10 text-[#8B5E3C] dark:text-stone-400 group-hover:rotate-6 transition duration-300" />
        </div>
        <span className="font-semibold text-stone-700 dark:text-stone-300">
          {file ? file.name : "Nhấn hoặc kéo thả file .txt / .html vào đây"}
        </span>
        <span className="text-xs text-stone-500 mt-2">Hệ thống sẽ tự động tìm các tiêu đề lớn để chia chương</span>
      </div>

      {error && <p className="text-red-500 text-sm flex items-center gap-1"><AlertCircle className="size-4"/> {error}</p>}

      {/* Preview dữ liệu */}
      {isParsing && <p className="text-[#8B5E3C] text-sm animate-pulse flex items-center gap-2 justify-center"><Loader2 className="size-4 animate-spin"/> Đang phân tích cấu trúc file...</p>}
      
      {!isParsing && parsedChapters.length > 0 && (
        <div className="space-y-4 animate-fade-in border-t border-stone-100 dark:border-stone-800 pt-4">
          <div className="flex justify-between items-center bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-400">
            <span className="font-semibold flex items-center gap-2">
              <CheckCircle className="size-5"/> Nhận diện thành công {parsedChapters.length} chương
            </span>
          </div>
          
          {/* Cửa sổ xem trước các chương tìm được */}
          <div className="max-h-72 overflow-y-auto space-y-3 pr-2 border border-stone-200 dark:border-stone-800 rounded-lg p-3 bg-stone-50 dark:bg-stone-950">
            {parsedChapters.map((ch) => (
              <div key={ch.number} className="p-3 bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-100 dark:border-stone-800 flex flex-col gap-1">
                <div className="flex gap-2 items-start">
                    <span className="bg-[#EADBC8] dark:bg-stone-800 text-[#5C3D2E] dark:text-stone-300 text-xs font-bold px-2 py-1 rounded-md shrink-0 mt-0.5">
                        Ch. {ch.number}
                    </span>
                    <p className="font-bold text-[#5C3D2E] dark:text-[#EADBC8] text-sm leading-snug">{ch.title}</p>
                </div>
                {/* Lọc bỏ bớt thẻ HTML để hiển thị preview cho gọn */}
                <p className="text-xs text-stone-500 line-clamp-2 mt-1 pl-10 italic">
                    {ch.content.replace(/<[^>]*>?/gm, ' ')}...
                </p>
              </div>
            ))}
          </div>

          <Button 
            onClick={handleSaveToDatabase} 
            disabled={isUploading || isParsing}
            className="w-full bg-[#8B5E3C] hover:bg-[#5C3D2E] text-white rounded-xl h-11"
          >
            {isUploading ? <><Loader2 className="size-4 mr-2 animate-spin"/> Đang đẩy lên hệ thống...</> : 'Lưu toàn bộ chương vào truyện'}
          </Button>
        </div>
      )}
    </div>
  )
}