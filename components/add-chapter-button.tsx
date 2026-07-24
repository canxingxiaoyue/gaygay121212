'use client'

import { useState, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, Upload, FileText, FileCode, Keyboard, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { addNewChapter, updateChapterContent, bulkImportChapters } from '@/app/actions/admin'
import { cn } from '@/lib/utils'

interface ParsedChapter {
  title: string
  number: number
  content: string
}

export function AddChapterButton({
  storySlug,
  currentCount,
}: {
  storySlug: string
  currentCount: number
}) {
  const { user, isSignedIn } = useUser()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'manual' | 'file'>('manual')
  
  // 1. STATE THÊM CHƯƠNG THỦ CÔNG
  const [manualTitle, setManualTitle] = useState(`Chương ${currentCount + 1}`)
  const [manualContent, setManualContent] = useState('')

  // 2. STATE NHẬP TỪ TỆP TIN
  const [fileName, setFileName] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [parsedChapters, setParsedChapters] = useState<ParsedChapter[]>([])
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 3. STATE TIẾN TRÌNH IMPORT
  const [progress, setProgress] = useState<number>(0)
  const [isImporting, setIsImporting] = useState(false)
  const [importSuccess, setImportSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const isAdmin = isSignedIn && user?.id === process.env.NEXT_PUBLIC_ADMIN_ID

  if (!isAdmin) return null

  // 🌟 HÀM 1: CHUYỂN ĐỔI HTML/WORD SANG TEXT THUẦN (BẢO TỒN KÝ TỰ XUỐNG DÒNG TUYỆT ĐỐI)
  const htmlToRawTextWithNewlines = (html: string): string => {
    if (typeof window === 'undefined') return html
    const tempDiv = document.createElement('div')
    
    // Ép các thẻ ngắt dòng/đoạn của HTML thành ký tự \n trước khi cho vào DOM
    let preProcessedHtml = html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '\n')

    tempDiv.innerHTML = preProcessedHtml

    // Loại bỏ các thẻ rác (script, style...)
    const unwantedTags = tempDiv.querySelectorAll('script, style, iframe, link, meta, noscript')
    unwantedTags.forEach(tag => tag.remove())

    // Thu lấy text nguyên thủy với các dấu \n đã được bảo tồn
    return tempDiv.textContent || tempDiv.innerText || ""
  }

  // 🌟 HÀM 2: TỰ ĐỘNG TÁCH CHƯƠNG VÀ BẢO TỒN 100% CẤU TRÚC ĐOẠN VĂN GỐC
  const processTextToChapters = (text: string): ParsedChapter[] => {
    // Chuẩn hóa \r\n thành \n (Phục vụ file từ Windows)
    const normalizedText = text.replace(/\r\n/g, '\n')
    const lines = normalizedText.split('\n')
    
    const chapters: ParsedChapter[] = []
    let currentChapter: ParsedChapter | null = null
    let currentParagraphs: string[] = []

    // REGEX nhận diện tiêu đề chương thông minh
    const headerRegex = /^(Chương|CHƯƠNG|chương)\s+(\d+)([\s:\-–—]+(.*))?$/i

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i]
      const trimmedLine = rawLine.trim() // Chỉ trim hai đầu, KHÔNG xóa line nếu nó rỗng

      const match = trimmedLine.match(headerRegex)
      
      // Giới hạn độ dài < 200 ký tự để tránh nhận diện nhầm đoạn văn có chữ "Chương" ở đầu
      if (match && trimmedLine.length < 200) {
        // Nếu đang ở chương trước đó, hãy đóng gói nó lại
        if (currentChapter) {
          // Bọc đoạn văn. ĐẶC BIỆT: Dòng rỗng sẽ biến thành thẻ <p><br/></p> để giữ nguyên khoảng trống
          currentChapter.content = currentParagraphs.map(p => {
            return p === "" 
              ? `<p class="mb-5"><br/></p>` 
              : `<p class="mb-5 text-pretty">${p}</p>`
          }).join('')
          chapters.push(currentChapter)
        }

        const chapNum = parseInt(match[2], 10)
        const chapTitleRest = match[4] ? match[4].trim() : ""
        const fullTitle = chapTitleRest ? `Chương ${match[2]}: ${chapTitleRest}` : `Chương ${match[2]}`

        currentChapter = {
          title: fullTitle,
          number: chapNum,
          content: ""
        }
        currentParagraphs = []
      } else {
        if (currentChapter) {
          // Thêm dòng vào chương (Dù rỗng hay có chữ đều giữ nguyên)
          currentParagraphs.push(trimmedLine)
        }
      }
    }

    // Đóng gói chương cuối cùng
    if (currentChapter) {
      currentChapter.content = currentParagraphs.map(p => {
        return p === "" 
          ? `<p class="mb-5"><br/></p>` 
          : `<p class="mb-5 text-pretty">${p}</p>`
      }).join('')
      chapters.push(currentChapter)
    }

    return chapters
  }

  // Xử lý nạp tệp và bắt đầu bóc tách
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsParsing(true)
    setFileName(file.name)
    setParsedChapters([])
    setPreviewIndex(null)
    setImportSuccess(false)
    setProgress(0)

    const extension = file.name.split('.').pop()?.toLowerCase()

    try {
      if (extension === 'txt') {
        const reader = new FileReader()
        reader.onload = (event) => {
          const text = event.target?.result as string
          const list = processTextToChapters(text)
          setParsedChapters(list)
          if (list.length > 0) setPreviewIndex(0)
          setIsParsing(false)
        }
        reader.readAsText(file, 'UTF-8')
      } 
      else if (extension === 'html' || extension === 'htm') {
        const reader = new FileReader()
        reader.onload = (event) => {
          const html = event.target?.result as string
          const rawText = htmlToRawTextWithNewlines(html)
          const list = processTextToChapters(rawText)
          setParsedChapters(list)
          if (list.length > 0) setPreviewIndex(0)
          setIsParsing(false)
        }
        reader.readAsText(file, 'UTF-8')
      } 
      else if (extension === 'docx' || extension === 'doc') {
        if (extension === 'doc') {
          alert("Tệp .doc cũ không thể giải mã. Vui lòng mở tệp trong Word và nhấn 'Save As' dưới dạng '.docx'")
          setFileName('')
          setIsParsing(false)
          return
        }
        const arrayBuffer = await file.arrayBuffer()
        const mammoth = await import('mammoth')
        const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer })
        const rawText = htmlToRawTextWithNewlines(result.value)
        const list = processTextToChapters(rawText)
        setParsedChapters(list)
        if (list.length > 0) setPreviewIndex(0)
        setIsParsing(false)
      } 
      else {
        alert("Hệ thống chỉ hỗ trợ tệp tin dạng .txt, .html, .docx")
        setFileName('')
        setIsParsing(false)
      }
    } catch (err: any) {
      alert("Lỗi khi đọc file: " + err.message)
      setFileName('')
      setIsParsing(false)
    }
  }

  // IMPORT ĐỒNG LOẠT (CHIA BATCH CHỐNG TREO)
  const handleBulkImport = async () => {
    if (parsedChapters.length === 0) return

    setIsImporting(true)
    setImportSuccess(false)
    setProgress(1)

    const batchSize = 10
    let currentStartCount = currentCount

    try {
      for (let i = 0; i < parsedChapters.length; i += batchSize) {
        const batch = parsedChapters.slice(i, i + batchSize)
        const res = await bulkImportChapters(storySlug, currentStartCount, batch)
        
        if (!res.success) throw new Error(res.error || "Gặp lỗi không rõ từ cơ sở dữ liệu.")

        currentStartCount += batch.length
        const currentProgress = Math.round(((i + batch.length) / parsedChapters.length) * 100)
        setProgress(currentProgress)
      }

      setImportSuccess(true)
      router.refresh()
    } catch (err: any) {
      alert("Quá trình import bị gián đoạn: " + err.message)
    } finally {
      setIsImporting(false)
    }
  }

  // IMPORT 1 CHƯƠNG KHI KHÔNG TÌM THẤY TIÊU ĐỀ
  const handleImportSingleChapter = () => {
    if (!fileInputRef.current?.files?.[0]) return
    const file = fileInputRef.current.files[0]
    setIsParsing(true)
    setImportSuccess(false)
    
    const reader = new FileReader()
    reader.onload = async (event) => {
      let text = event.target?.result as string
      // Phục hồi HTML/DOCX sang dạng text chuẩn trước nếu cần
      if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
        text = htmlToRawTextWithNewlines(text)
      }

      const lines = text.replace(/\r\n/g, '\n').split('\n')
      const cleanContent = lines.map(p => {
        const t = p.trim()
        return t === "" ? `<p class="mb-5"><br/></p>` : `<p class="mb-5 text-pretty">${t}</p>`
      }).join('')

      const singleChapter = [{
        title: file.name.substring(0, file.name.lastIndexOf('.')) || "Chương mới nhập",
        number: currentCount + 1,
        content: cleanContent
      }]
      
      setParsedChapters(singleChapter)
      setPreviewIndex(0)
      setIsParsing(false)
    }

    if (file.name.endsWith('.docx')) {
      alert("Tính năng Import 1 chương nguyên khối chưa hỗ trợ trực tiếp .docx. Vui lòng chuyển thành .txt hoặc thêm tiêu đề 'Chương 1' vào đầu file Word.")
      setIsParsing(false)
      return
    }

    reader.readAsText(file, 'UTF-8')
  }

  // Tạo chương thủ công
  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualTitle.trim() || !manualContent.trim()) {
      alert("Vui lòng nhập đầy đủ thông tin chương!")
      return
    }

    setIsLoading(true)
    const res = await addNewChapter(storySlug, currentCount)
    if (res.success && res.nextChapterNum) {
      // Bảo tồn xuống dòng khi nhập thủ công
      const lines = manualContent.replace(/\r\n/g, '\n').split('\n')
      const formattedContent = lines.map(p => {
        const t = p.trim()
        return t === "" ? `<p class="mb-5"><br/></p>` : `<p class="mb-5 text-pretty">${t}</p>`
      }).join('')

      await updateChapterContent(storySlug, res.nextChapterNum, formattedContent, manualTitle)
      router.refresh()
      setIsOpen(false)
      router.push(`/truyen/${storySlug}/${res.nextChapterNum}`)
    } else {
      alert("Lỗi: " + res.error)
    }
    setIsLoading(false)
  }

  return (
    <div className="flex gap-2 relative font-cute-quicksand z-50">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@600;700&family=Quicksand:wght@500;600;700&display=swap');
        .font-cute-quicksand {
          font-family: 'Quicksand', sans-serif !important;
        }
        .font-cute-comfortaa {
          font-family: 'Comfortaa', sans-serif !important;
        }
      `}} />

      {/* NÚT 1: THÊM THỦ CÔNG */}
      <Button
        onClick={() => {
          setActiveTab('manual')
          setManualTitle(`Chương ${currentCount + 1}`)
          setManualContent('')
          setIsOpen(true)
        }}
        size="sm"
        className="bg-amber-800 hover:bg-amber-700 text-white rounded-xl text-xs gap-1.5 h-8 px-3 shadow-sm transition-all hover:scale-[1.02] border-none"
      >
        <Plus className="size-3.5" />
        Thêm chương
      </Button>

      {/* NÚT 2: NHẬP TỪ TỆP TIN */}
      <Button
        onClick={() => {
          setActiveTab('file')
          setFileName('')
          setParsedChapters([])
          setPreviewIndex(null)
          setImportSuccess(false)
          setProgress(0)
          setIsOpen(true)
        }}
        size="sm"
        variant="outline"
        className="border border-[#E5D8C8] dark:border-stone-850 hover:bg-stone-50 dark:hover:bg-stone-800/50 rounded-xl text-xs gap-1.5 h-8 px-3 shadow-sm transition-all hover:scale-[1.02] text-stone-700 dark:text-stone-300"
      >
        <Upload className="size-3.5" />
        Nhập từ tệp
      </Button>

      {/* MÀNG PHỦ NỀN CLICK AWAY */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/45 backdrop-blur-xs duration-200 z-[9999]"
          onClick={() => !isImporting && !isLoading && setIsOpen(false)}
        />
      )}

      {/* CỬA SỔ POPUP */}
      {isOpen && (
        <div 
          className={cn(
            "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] p-5 sm:p-6 rounded-[22px] border border-stone-200 dark:border-stone-800 bg-[#FFFDFB] dark:bg-stone-900 shadow-2xl z-[10000] flex flex-col gap-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-200/50 dark:border-stone-800">
            <span className="text-sm font-bold text-stone-800 dark:text-stone-200 font-cute-comfortaa flex items-center gap-1.5">
              🌙 Góc quản lý chương truyện
            </span>
            <button
              type="button"
              onClick={() => !isImporting && !isLoading && setIsOpen(false)}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors"
            >
              <X className="size-4.5" />
            </button>
          </div>

          {/* TABS CHUYỂN ĐỔI CHẾ ĐỘ */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100/50 dark:bg-stone-950/20 rounded-xl">
            <button
              onClick={() => !isImporting && setActiveTab('manual')}
              className={cn(
                "py-1.5 rounded-lg text-xs font-bold transition-all",
                activeTab === 'manual'
                  ? "bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 shadow-sm"
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-800"
              )}
            >
              ➕ Thêm thủ công
            </button>
            <button
              onClick={() => !isImporting && setActiveTab('file')}
              className={cn(
                "py-1.5 rounded-lg text-xs font-bold transition-all",
                activeTab === 'file'
                  ? "bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 shadow-sm"
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-800"
              )}
            >
              📂 Nhập từ tệp tin
            </button>
          </div>

          {/* PHÂN LUỒNG 1: THÊM THỦ CÔNG */}
          {activeTab === 'manual' && (
            <form onSubmit={handleAddManual} className="flex flex-col gap-4 text-xs text-left">
              <div className="space-y-1.5">
                <label className="font-bold text-stone-600 dark:text-stone-300">Tiêu đề chương:</label>
                <Input
                  type="text"
                  required
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="Ví dụ: Chương 1: Sự khởi đầu mới..."
                  className="h-9.5 rounded-xl border border-stone-200 dark:border-stone-850 bg-stone-50/10 focus-visible:ring-amber-500 font-semibold px-4 text-xs w-full text-stone-800 dark:text-stone-100"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-600 dark:text-stone-300">Nội dung chương:</label>
                <Textarea
                  required
                  value={manualContent}
                  onChange={(e) => setManualContent(e.target.value)}
                  placeholder="Dán hoặc viết nội dung chương truyện vào đây..."
                  className="min-h-[160px] max-h-[260px] rounded-xl border-stone-200 dark:border-stone-850 bg-stone-50/10 focus-visible:ring-amber-500 p-3.5 leading-relaxed text-xs text-stone-800 dark:text-stone-100 whitespace-pre-wrap"
                  disabled={isLoading}
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-stone-200/40 dark:border-stone-800 pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                  className="h-9 px-4 rounded-xl text-xs font-semibold dark:text-stone-300 dark:hover:bg-stone-800"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-9 px-5 rounded-xl text-xs font-bold bg-amber-800 hover:bg-amber-700 text-white"
                >
                  {isLoading ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                  Tạo và Lưu chương
                </Button>
              </div>
            </form>
          )}

          {/* PHÂN LUỒNG 2: NHẬP TỪ TỆP TIN */}
          {activeTab === 'file' && (
            <div className="flex flex-col gap-4 text-xs text-left">
              {/* Vùng chọn và tải tệp */}
              <div className="space-y-2">
                <label className="font-bold text-stone-600 dark:text-stone-300">Chọn tệp tin nội dung (Tự động tách chương):</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".txt,.html,.htm,.docx"
                  className="hidden"
                  disabled={isImporting}
                />
                <div 
                  onClick={() => !isImporting && !isParsing && fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors duration-200 bg-stone-50/10",
                    fileName 
                      ? "border-amber-800/60 bg-amber-500/5" 
                      : "border-stone-200 hover:border-stone-450 hover:bg-stone-100/50 dark:border-stone-850 dark:hover:border-stone-800/40"
                  )}
                >
                  {isParsing ? (
                    <>
                      <Loader2 className="size-8 animate-spin text-amber-800 dark:text-amber-400" />
                      <span className="text-[11px] font-bold text-stone-500">Đang giải mã và phân tích tệp...</span>
                    </>
                  ) : fileName ? (
                    <>
                      <FileText className="size-8 text-amber-800 dark:text-amber-400" />
                      <span className="text-[11.5px] font-bold text-stone-800 dark:text-stone-200 text-center truncate max-w-xs">{fileName}</span>
                      <span className="text-[10px] text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="size-3.5" /> Giải mã tệp tin thành công!
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="size-8 text-stone-400" />
                      <span className="text-[11.5px] font-bold text-stone-600 dark:text-stone-300">Nhấp để tải tệp truyện lên</span>
                      <span className="text-[10px] text-stone-400 dark:text-stone-500 text-center">Hỗ trợ .txt, .html, .docx (Word)</span>
                    </>
                  )}
                </div>
              </div>

              {/* XỬ LÝ LỖI KHÔNG TÌM THẤY TIÊU ĐỀ CHƯƠNG */}
              {fileName && !isParsing && parsedChapters.length === 0 && (
                <div className="p-3.5 bg-red-500/5 rounded-xl border border-red-500/20 text-red-700 dark:text-red-400 flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-bold text-[11.5px]">
                    <AlertCircle className="size-4 shrink-0 text-red-500" />
                    Không phát hiện tiêu đề chương mới nào!
                  </div>
                  <p className="text-[10.5px] leading-relaxed">Hệ thống không tìm thấy từ khóa chương dạng "Chương X" nào trong tệp tin để tiến hành bóc tách tự động.</p>
                  <div className="flex gap-2 mt-1">
                    <Button onClick={handleImportSingleChapter} size="sm" className="bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/20 text-[10px] h-7 rounded-lg">
                      Import làm 1 chương duy nhất
                    </Button>
                    <Button onClick={() => { setFileName(''); setParsedChapters([]) }} size="sm" variant="ghost" className="text-[10px] h-7 rounded-lg text-stone-500">
                      Hủy bỏ
                    </Button>
                  </div>
                </div>
              )}

              {/* VÙNG PREVIEW DANH SÁCH CHƯƠNG ĐÃ NHẬN DIỆN THÀNH CÔNG */}
              {parsedChapters.length > 0 && (
                <div className="space-y-2.5 animate-fade-in">
                  <div className="flex justify-between items-center text-[11.5px] font-bold text-stone-600 dark:text-stone-300">
                    <span>📚 Nhận diện thành công: {parsedChapters.length} chương</span>
                    <span className="text-amber-800 dark:text-amber-400">Import từ: Chương {currentCount + 1}</span>
                  </div>

                  {/* Grid xem trước chương */}
                  <div className="grid grid-cols-5 gap-2 border border-stone-200/60 dark:border-stone-850 p-2.5 rounded-xl bg-stone-50/10">
                    <div className="col-span-2 max-h-40 overflow-y-auto space-y-1 pr-1 border-r border-stone-200/50 dark:border-stone-850/60">
                      {parsedChapters.map((chap, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPreviewIndex(idx)}
                          className={cn(
                            "w-full text-left px-2 py-1.5 rounded-lg text-[10.5px] font-semibold truncate block transition-colors",
                            previewIndex === idx
                              ? "bg-amber-800/10 text-amber-900 dark:bg-stone-850 dark:text-amber-400 font-bold"
                              : "text-stone-500 hover:bg-stone-50"
                          )}
                        >
                          {chap.title}
                        </button>
                      ))}
                    </div>

                    <div className="col-span-3 max-h-40 overflow-y-auto p-2 rounded-lg bg-stone-100/30 dark:bg-stone-950/20 text-[10px] text-stone-600 dark:text-stone-400 leading-relaxed pr-1 select-none whitespace-pre-wrap">
                      {previewIndex !== null && parsedChapters[previewIndex] ? (
                        <>
                          <p className="font-bold text-stone-800 dark:text-stone-200 mb-2 border-b border-stone-200/30 pb-1.5">{parsedChapters[previewIndex].title}</p>
                          <div dangerouslySetInnerHTML={{ __html: parsedChapters[previewIndex].content }} />
                        </>
                      ) : (
                        <p className="text-center italic py-10">Chọn một chương ở bên để xem trước nội dung...</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* THANH TIẾN TRÌNH IMPORT ĐỒNG LOẠT */}
              {isImporting && (
                <div className="space-y-2 animate-fade-in bg-stone-50/10 p-3 rounded-xl border border-stone-200/40">
                  <div className="flex justify-between items-center text-[10px] font-bold text-stone-500">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="size-3 animate-spin text-amber-800" />
                      Đang đồng bộ dữ liệu lên máy chủ...
                    </span>
                    <span className="font-semibold">{progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-800 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Thông báo import hoàn thành */}
              {importSuccess && (
                <div className="p-3 bg-green-500/5 border border-green-500/20 text-green-700 dark:text-green-400 rounded-xl text-[11px] font-bold flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="size-4 shrink-0 text-green-600 dark:text-green-400" />
                  Đã nhập hoàn tất {parsedChapters.length} chương vào truyện thành công!
                </div>
              )}

              {/* Các nút bấm điều khiển tệp */}
              <div className="flex justify-end gap-2.5 mt-2 border-t border-stone-200/40 dark:border-stone-800 pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  disabled={isImporting || isParsing}
                  className="h-9 px-4 rounded-xl text-xs font-semibold dark:text-stone-300 dark:hover:bg-stone-800"
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  onClick={handleBulkImport}
                  disabled={isImporting || isParsing || parsedChapters.length === 0}
                  className="h-9 px-5 rounded-xl text-xs font-bold bg-amber-800 hover:bg-amber-700 text-white gap-1.5"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Đang nhập...
                    </>
                  ) : (
                    "Bắt đầu Import"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Dòng chữ nhỏ tinh tế ở chân thiệp */}
          <div className="text-center text-[10px] italic opacity-60 mt-1 select-none pointer-events-none text-stone-500 dark:text-stone-400">
            🐾 Mèo Klein sẽ hỗ trợ giải mã tệp tin thành trang đọc đẹp mắt.
          </div>
        </div>
      )}
    </div>
  )
}