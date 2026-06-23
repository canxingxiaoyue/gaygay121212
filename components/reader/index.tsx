'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useTheme } from 'next-themes'
import { ChevronLeft, ChevronRight, List, Edit, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useApp } from '@/components/favorites-provider'
import type { Chapter, Story } from '@/lib/stories'

// Imports từ các file bóc tách con [1.1.2]
import { ReaderToolbar } from './reader-toolbar'
import { AdminEditor } from './admin-editor'
import { ParagraphComments } from './paragraph-comments'

import { updateChapterContent, uploadImage } from '@/app/actions/admin'
import { getParagraphComments, addParagraphComment, deleteParagraphComment, updateParagraphComment, getChapterParagraphCommentCounts } from '@/app/actions/paragraph-comments'
import { cn } from '@/lib/utils'

// BẢNG ÁNH XẠ PHÔNG CHỮ CHUẨN GOOGLE FONTS
const FONT_MAPPING: Record<string, string> = {
  serif: "Lora, Georgia, 'Times New Roman', serif",
  quicksand: "'Quicksand', sans-serif",
  nunito: "'Nunito', sans-serif",
  lexend: "'Lexend', sans-serif",
  comfortaa: "'Comfortaa', sans-serif",
  manrope: "'Manrope', sans-serif",
}

// BẢNG ÁNH XẠ 6 HỆ MÀU GIAO DIỆN ĐỌC SÁCH TOÀN DIỆN
const THEME_MAPPING: Record<string, { container: string; text: string; badge: string }> = {
  light: {
    container: "bg-[#FFFDFB] dark:bg-stone-900 border-stone-200/60 dark:border-stone-850",
    text: "text-stone-900 dark:text-stone-100",
    badge: "bg-[#8B5E3C] text-white border-white dark:border-stone-900"
  },
  dark: {
    container: "bg-[#131110] border-stone-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
    text: "text-[#e7e5e4]",
    badge: "bg-[#EADBC8] text-stone-950 border-stone-950"
  },
  sepia: {
    container: "bg-[#F4ECD8] border-[#EADBC8]",
    text: "text-[#5C3D2E]",
    badge: "bg-[#8B5E3C] text-[#F4ECD8] border-[#F4ECD8]" // Đồng bộ màu vàng hổ phách và chữ kem sữa cực đẹp
  },
  emerald: {
    container: "bg-[#EAEFE3] border-[#D2DAC3]",
    text: "text-[#3B4D31]",
    badge: "bg-[#3B4D31] text-[#EAEFE3] border-[#EAEFE3]"
  },
  coffee: {
    container: "bg-[#F0E6DF] border-[#DECAC0]",
    text: "text-[#4A3228]",
    badge: "bg-[#4A3228] text-[#F0E6DF] border-[#F0E6DF]"
  },
  rose: {
    container: "bg-[#FDF0F2] border-[#F5D6D8]",
    text: "text-[#632B30]",
    badge: "bg-[#632B30] text-[#FDF0F2] border-[#FDF0F2]"
  }
}

// BẢNG MÀU NÚT SOẠN THẢO KLEIN: ĐẬM ĐÀ HƠN MÀU NỀN THEME ĐÃ CHỌN
const KLEIN_BTN_THEME: Record<string, string> = {
  light: "bg-[#F4EEE6] border-[#E5D8C8] hover:bg-[#EADBCE] text-[#5C3D2E]",
  dark: "bg-stone-850/80 border-stone-800 hover:bg-stone-800 text-[#efebe9]",
  sepia: "bg-[#EADBC8]/70 border-[#DEC4B0] hover:bg-[#DEC4B0] text-[#5C3D2E]",
  emerald: "bg-[#DDE6D5] border-[#C8D3BE] hover:bg-[#C8D3BE] text-[#3B4D31]",
  coffee: "bg-[#E0D2C8] border-[#D0BFAF] hover:bg-[#D0BFAF] text-[#4A3228]",
  rose: "bg-[#F9E2E5] border-[#F5D6D8] hover:bg-[#EDCCD2] text-[#632B30]",
}

// BẢNG MÀU POPUP BÌNH LUẬN ĐỒNG BỘ MÀU NỀN THEME (NÂNG CẤP ĐỒNG BỘ THẨM MỸ CAO CẤP)
const POPUP_THEME_MAPPING: Record<string, { 
  container: string; 
  quote: string; 
  input: string; 
  text: string; 
  button: string;
  reactionBg: string;
  activeEmoji: string;
  sendBtn: string;
  close: string;     // State màu đóng X động
  fallback: string;  // State màu avatar dự phòng
  activeBadge: string; // State màu đếm trên nhãn dán được chọn
  inactiveBadge: string; // State màu đếm trên nhãn dán chưa chọn
  editBtn: string;  // Màu chữ nút Sửa
  deleteBtn: string; // Màu chữ nút Xóa
}> = {
  light: {
    container: "bg-[#FFFDFB] text-stone-900 border-stone-200/60 dark:border-stone-850",
    quote: "bg-[#F4EEE6]/50 border-[#E5D8C8]/40 text-stone-500",
    input: "border-stone-200 bg-[#FFFDFB] focus-visible:ring-amber-500",
    text: "text-stone-700 dark:text-stone-300",
    button: "hover:bg-[#F4EEE6] text-[#5C3D2E]",
    reactionBg: "bg-[#F4EEE6]/40 border-[#E5D8C8]/40",
    activeEmoji: "bg-[#8B5E3C] border-[#8B5E3C] text-white shadow-[0_0_15px_rgba(139,94,60,0.3)] scale-[1.03]",
    sendBtn: "bg-[#8B5E3C] hover:bg-[#5C3D2E] text-white shadow-[0_4px_10px_rgba(139,94,60,0.15)]",
    close: "text-[#5C3D2E]/50 hover:text-[#5C3D2E]",
    fallback: "bg-[#F4EEE6] text-[#8B5E3C] dark:bg-stone-800 dark:text-[#EADBC8]",
    activeBadge: "bg-[#FFFDFB] text-[#8B5E3C] border-amber-200/20",
    inactiveBadge: "bg-[#F4EEE6] text-stone-500 border-stone-200/40",
    editBtn: "text-stone-400 hover:text-[#8B5E3C]",
    deleteBtn: "text-stone-400 hover:text-[#8B5E3C]" // 🌟 Đồng bộ khớp Sửa ở hệ màu Sáng
  },
  dark: {
    container: "bg-[#131110] border-stone-800 text-[#e7e5e4] shadow-[0_20px_50px_rgba(0,0,0,0.5)]",
    quote: "bg-stone-950/40 border-stone-800 text-stone-400",
    input: "border-stone-800 bg-[#131110] focus-visible:ring-stone-700",
    text: "text-stone-300",
    button: "hover:bg-stone-800 text-stone-200",
    reactionBg: "bg-stone-950/40 border-stone-800",
    activeEmoji: "bg-[#EADBC8] border-[#EADBC8] text-stone-950 shadow-[0_0_15px_rgba(234,219,200,0.3)]",
    sendBtn: "bg-stone-800 hover:bg-stone-700 text-stone-100 shadow-[0_4px_10px_rgba(0,0,0,0.3)]",
    close: "text-[#e7e5e4]/50 hover:text-[#e7e5e4]",
    fallback: "bg-stone-800 text-[#EADBC8]",
    activeBadge: "bg-[#131110] text-[#EADBC8] border-stone-850",
    inactiveBadge: "bg-stone-800 text-stone-400 border-stone-800",
    editBtn: "text-stone-500 hover:text-[#EADBC8]",
    deleteBtn: "text-stone-500 hover:text-[#EADBC8]" // 🌟 Đồng bộ khớp Sửa ở hệ màu Tối
  },
  sepia: {
    container: "bg-[#F4ECD8] text-[#5C3D2E] border-[#EADBC8] shadow-[0_20px_50px_rgba(92,61,46,0.15)]",
    quote: "bg-[#EADBC8]/30 border-[#EADBC8]/40 text-[#5C3D2E]/80",
    input: "border-[#EADBC8] bg-[#F4ECD8] focus-visible:ring-[#8B5E3C]",
    text: "text-[#5C3D2E]/90",
    button: "hover:bg-[#EADBC8] text-[#5C3D2E]",
    reactionBg: "bg-[#EADBC8]/30 border-[#EADBC8]/45",
    activeEmoji: "bg-[#8B5E3C] border-[#8B5E3C] text-white shadow-[0_0_15px_rgba(139,94,60,0.3)] scale-[1.03]",
    sendBtn: "bg-[#8B5E3C] hover:bg-[#5C3D2E] text-white shadow-[0_4px_10px_rgba(92,61,46,0.15)]",
    close: "text-[#5C3D2E]/50 hover:text-[#5C3D2E]",
    fallback: "bg-[#EADBC8]/40 text-[#5C3D2E]",
    activeBadge: "bg-[#F4ECD8] text-[#8B5E3C] border-[#DEC4B0]",
    inactiveBadge: "bg-[#EADBC8]/50 text-[#5C3D2E]/60 border-[#EADBC8]/40",
    editBtn: "text-[#5C3D2E]/45 hover:text-[#5C3D2E]",
    deleteBtn: "text-[#5C3D2E]/45 hover:text-[#5C3D2E]" // 🌟 Đồng bộ khớp Sửa ở hệ màu Sepia
  },
  emerald: {
    container: "bg-[#EAEFE3] text-[#3B4D31] border-[#D2DAC3] shadow-[0_20px_50px_rgba(59,77,49,0.15)]",
    quote: "bg-[#DDE6D5]/40 border-[#D2DAC3]/40 text-[#3B4D31]/80",
    input: "border-[#D2DAC3] bg-[#EAEFE3] focus-visible:ring-[#3B4D31]",
    text: "text-[#3B4D31]/90",
    button: "hover:bg-[#DDE6D5] text-[#3B4D31]",
    reactionBg: "bg-[#DDE6D5]/40 border-[#D2DAC3]/45",
    activeEmoji: "bg-[#3B4D31] border-[#3B4D31] text-white shadow-[0_0_15px_rgba(59,77,49,0.3)] scale-[1.03]",
    sendBtn: "bg-[#3B4D31] hover:bg-[#2F3D27] text-white shadow-[0_4px_10px_rgba(59,77,49,0.15)]",
    close: "text-[#3B4D31]/50 hover:text-[#3B4D31]",
    fallback: "bg-[#DDE6D5] text-[#3B4D31]",
    activeBadge: "bg-[#EAEFE3] text-[#3B4D31] border-[#D2DAC3]/60",
    inactiveBadge: "bg-[#DDE6D5]/50 text-[#3B4D31]/60 border-[#DDE6D5]/40",
    editBtn: "text-[#3B4D31]/45 hover:text-[#3B4D31]",
    deleteBtn: "text-[#3B4D31]/45 hover:text-[#3B4D31]" // 🌟 Đồng bộ khớp Sửa ở hệ màu Emerald
  },
  coffee: {
    container: "bg-[#F0E6DF] text-[#4A3228] border-[#DECAC0] shadow-[0_20px_50px_rgba(74,50,40,0.15)]",
    quote: "bg-[#E0D2C8]/40 border-[#DECAC0]/40 text-[#4A3228]/80",
    input: "border-[#DECAC0] bg-[#F0E6DF] focus-visible:ring-[#4A3228]",
    text: "text-[#4A3228]/90",
    button: "hover:bg-[#E0D2C8] text-[#4A3228]",
    reactionBg: "bg-[#E0D2C8]/40 border-[#DECAC0]/45",
    activeEmoji: "bg-[#4A3228] border-[#4A3228] text-white shadow-[0_0_15px_rgba(74,50,40,0.3)] scale-[1.03]",
    sendBtn: "bg-[#4A3228] hover:bg-[#38221A] text-white shadow-[0_4px_10px_rgba(74,50,40,0.15)]",
    close: "text-[#4A3228]/50 hover:text-[#4A3228]",
    fallback: "bg-[#E0D2C8] text-[#4A3228]",
    activeBadge: "bg-[#F0E6DF] text-[#4A3228] border-[#DECAC0]/60",
    inactiveBadge: "bg-[#E0D2C8]/50 text-[#4A3228]/60 border-[#E0D2C8]/40",
    editBtn: "text-[#4A3228]/45 hover:text-[#4A3228]",
    deleteBtn: "text-[#4A3228]/45 hover:text-[#4A3228]" // 🌟 Đồng bộ khớp Sửa ở hệ màu Coffee
  },
  rose: {
    container: "bg-[#FDF0F2] text-[#632B30] border-[#F5D6D8] shadow-[0_20px_50px_rgba(99,43,48,0.15)]",
    quote: "bg-[#F9E2E5]/40 border-[#F5D6D8]/40 text-[#632B30]/80",
    input: "border-[#F5D6D8] bg-[#FDF0F2] focus-visible:ring-pink-400",
    text: "text-[#632B30]/90",
    button: "hover:bg-[#F9E2E5] text-[#632B30]",
    reactionBg: "bg-[#F9E2E5]/40 border-[#F5D6D8]/45",
    activeEmoji: "bg-[#632B30] border-[#632B30] text-white shadow-[0_0_15px_rgba(99,43,48,0.3)]",
    sendBtn: "bg-[#632B30] hover:bg-[#4F1A1F] text-white shadow-[0_4px_10px_rgba(99,43,48,0.15)]",
    close: "text-[#632B30]/50 hover:text-[#632B30]",
    fallback: "bg-[#F9E2E5] text-[#632B30]",
    activeBadge: "bg-[#FDF0F2] text-[#632B30] border-[#F5D6D8]/60",
    inactiveBadge: "bg-[#F9E2E5]/50 text-[#632B30]/60 border-[#F9E2E5]/40",
    editBtn: "text-[#632B30]/45 hover:text-[#632B30]",
    deleteBtn: "text-[#632B30]/45 hover:text-[#632B30]" // 🌟 Đồng bộ khớp Sửa ở hệ màu Rose
  }
}

const KLEIN_STICKERS = [
  { id: 'blink', file: 'Kleinblink.jpg', label: 'Lấp lánh' },
  { id: 'canloi', file: 'Kleincanloi.jpg', label: 'Cạn lời' },
  { id: 'chamhoi', file: 'Kleinchamhoi.PNG', label: 'Chấm hỏi' },
  { id: 'ditu', file: 'Kleinditu.jpg', label: 'Bóc lịch' },
  { id: 'gaothet', file: 'Kleingaothet.jpg', label: 'Gào thét' },
  { id: 'ghichep', file: 'Kleinghichep.jpg', label: 'Ghi chép' },
  { id: 'gomo', file: 'Kleingomo.jpg', label: 'Gõ mõ tích đức' },
  { id: 'hoahong', file: 'Kleinhoahong.jpg', label: 'Tặng hoa hồng' },
  { id: 'khoc_nam', file: 'Kleinkhoc.jpg', label: 'Nằm khóc mệt mỏi' },
  { id: 'khoc_mat', file: 'Kleinkhoc.png', label: 'Mếu khóc' },
  { id: 'luoibieng', file: 'Kleinluoibieng.jpg', label: 'Trì trệ / lười biếng' },
  { id: 'nghingo', file: 'Kleinnghingo.jpg', label: 'Nghi ngờ' },
  { id: 'xinan', file: 'Kleinxinan.jpg', label: 'Ăn trực' },
]

export function ChapterReader({
  story,
  chapter,
  isAdmin,
}: {
  story: Story
  chapter: Chapter
  isAdmin: boolean
}) {
  const { theme, setTheme } = useTheme()
  const { recordReading } = useApp()
  const { user, isSignedIn } = useUser()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const commentFileInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const savedRangeRef = useRef<Range | null>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(chapter.title)
  const [editText, setEditText] = useState('')
  const [editorHtml, setEditorHtml] = useState('') 
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [fontSize, setFontSize] = useState<number>(18)
  const [fontFamily, setFontFamily] = useState<string>('serif')
  const [lineHeight, setLineHeight] = useState<string>('loose')
  const [containerWidth, setContainerWidth] = useState<string>('2xl')
  const [readerTheme, setReaderTheme] = useState<string>('light')
  const isRestoredRef = useRef(false)

  const [isSpeaking, setIsSpeaking] = useState(false)
  const [paraCommentOpen, setParaCommentOpen] = useState(false)
  const [activeParaIndex, setActiveParaIndex] = useState<number>(0)
  const [activeParaText, setActiveParaText] = useState<string>('')
  const [paraComments, setParaComments] = useState<any[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isSending, setIsSending] = useState(false)
  
  const [commentText, setCommentText] = useState('')
  const [commentImgUrl, setCommentImgUrl] = useState('')
  const [isUploadingCommentImg, setIsUploadingCommentImg] = useState(false)

  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editingCommentText, setEditingCommentText] = useState('')

  // States dành cho phản hồi lồng nhau
  const [replyingToId, setReplyingToId] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')
  const [expandedCommentIds, setExpandedCommentIds] = useState<number[]>([])

  // States phục vụ bình luận chân trang chương
  const [chapterComments, setChapterComments] = useState<any[]>([])
  const [isLoadingChapterComments, setIsLoadingChapterComments] = useState(false)
  const [chapterCommentText, setChapterCommentText] = useState('')
  const [chapterCommentImgUrl, setChapterCommentImgUrl] = useState('')
  const [isUploadingChapterCommentImg, setIsUploadingChapterCommentImg] = useState(false)
  const [chapterReplyingToId, setChapterReplyingToId] = useState<number | null>(null)
  const [chapterReplyText, setChapterReplyText] = useState('')
  const [chapterExpandedCommentIds, setChapterExpandedCommentIds] = useState<number[]>([])
  const chapterCommentFileInputRef = useRef<HTMLInputElement>(null)

  const [liveWordCount, setLiveWordCount] = useState(0)
  const [isZenEditing, setIsZenEditing] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [history, setHistory] = useState<{ timestamp: number; title: string; content: string; wordCount: number }[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)

  // State lưu số lượng bình luận cho mỗi đoạn văn
  const [paraCommentCounts, setParaCommentCounts] = useState<Record<number, number>>({})

  // KHÔI PHỤC MENU CHUỘT PHẢI SOẠN THẢO ADMIN
  const [contextMenuVisible, setContextMenuVisible] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] = useState({ top: 0, left: 0 })

  const total = story.chapters.length
  const hasPrev = chapter.number > 1
  const hasNext = chapter.number < total

  useEffect(() => {
    recordReading(story.slug, chapter.number)
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
    setIsEditing(false)
    setSettingsOpen(false)
    setParaCommentOpen(false)
    setHistoryOpen(false)
    setEditingCommentId(null)
    setReplyingToId(null)
    setChapterReplyingToId(null)
    savedRangeRef.current = null
  }, [story.slug, chapter.number])

  // 🌟 KHỞI TẠO TẢI SỐ LƯỢNG BÌNH LUẬN TRÊN MỖI ĐOẠN VĂN
  const loadCommentCounts = async () => {
    try {
      const counts = await getChapterParagraphCommentCounts(story.slug, chapter.number)
      const countsMap: Record<number, number> = {}
      counts.forEach(row => { countsMap[row.paragraph_index] = row.comment_count })
      setParaCommentCounts(countsMap)
    } catch (err) {}
  }

  const loadChapterComments = async () => {
    setIsLoadingChapterComments(true)
    try {
      const list = await getChapterAllComments(story.slug, chapter.number)
      setChapterComments(list || [])
    } catch (err) {
      console.error("Lỗi nạp bình luận chương:", err)
    } finally {
      setIsLoadingChapterComments(false)
    }
  }

  useEffect(() => { loadCommentCounts(); loadChapterComments() }, [story.slug, chapter.number])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedFontSize = window.localStorage.getItem('qt_fontsize')
    if (savedFontSize) setFontSize(Number(savedFontSize))
    const savedFontFamily = window.localStorage.getItem('qt_fontfamily')
    if (savedFontFamily) setFontFamily(savedFontFamily)
    const savedLineHeight = window.localStorage.getItem('qt_lineheight')
    if (savedLineHeight) setLineHeight(savedLineHeight)
    const savedContainerWidth = window.localStorage.getItem('qt_containerwidth')
    if (savedContainerWidth) setContainerWidth(savedContainerWidth)
    const savedReaderTheme = window.localStorage.getItem('qt_readertheme')
    if (savedReaderTheme) {
      setReaderTheme(savedReaderTheme)
      if (savedReaderTheme === 'dark') setTheme('dark')
      else setTheme('light')
    }
    isRestoredRef.current = true
  }, [setTheme])

  const changeFontSize = (newSize: number) => {
    setFontSize(newSize)
    if (typeof window !== 'undefined') window.localStorage.setItem('qt_fontsize', String(newSize))
  }

  const changeFontFamily = (newFamily: string) => {
    setFontFamily(newFamily)
    if (typeof window !== 'undefined') window.localStorage.setItem('qt_fontfamily', newFamily)
  }

  const changeLineHeight = (newLineHeight: string) => {
    setLineHeight(newLineHeight)
    if (typeof window !== 'undefined') window.localStorage.setItem('qt_lineheight', newLineHeight)
  }

  const changeContainerWidth = (newWidth: string) => {
    setContainerWidth(newWidth)
    if (typeof window !== 'undefined') window.localStorage.setItem('qt_containerwidth', newWidth)
  }

  const changeReaderTheme = (newTheme: string) => {
    setReaderTheme(newTheme)
    if (typeof window !== 'undefined') window.localStorage.setItem('qt_readertheme', newTheme)
    if (newTheme === 'dark') setTheme('dark')
    else setTheme('light')
  }

  useEffect(() => {
    if (isEditing && editorRef.current) { editorRef.current.innerHTML = editText }
  }, [isEditing, editText])

  useEffect(() => {
    if (!isEditing) return
    const draftKey = `draft_${story.slug}_${chapter.number}`
    localStorage.setItem(draftKey, JSON.stringify({ title: editTitle, content: editorHtml }))
    if (!editorHtml && !editTitle) return
    setSaveStatus('saving')
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await updateChapterContent(story.slug, chapter.number, editorHtml, editTitle)
        if (res.success) {
          setSaveStatus('saved')
          saveToHistory(editTitle, editorHtml)
        } else {
          setSaveStatus('error')
        }
      } catch (error) {
        setSaveStatus('error')
      }
    }, 2000)
    return () => clearTimeout(delayDebounceFn)
  }, [editTitle, editorHtml, isEditing, story.slug, chapter.number])

  const saveToHistory = (title: string, content: string) => {
    const historyKey = `history_${story.slug}_${chapter.number}`
    const wCount = countWords(content)
    const existingHistoryRaw = localStorage.getItem(historyKey)
    let currentHistory = []
    if (existingHistoryRaw) {
      try { currentHistory = JSON.parse(existingHistoryRaw) } catch (e) {}
    }
    if (currentHistory.length > 0 && currentHistory[0].content === content) return
    const newVersion = { timestamp: Date.now(), title, content, wordCount: wCount }
    const updatedHistory = [newVersion, ...currentHistory].slice(0, 15)
    localStorage.setItem(historyKey, JSON.stringify(updatedHistory))
    setHistory(updatedHistory)
  }

  const startEditing = () => {
    setEditTitle(chapter.title)
    const isRawText = chapter.content && chapter.content.length > 0 && !chapter.content[0].trim().startsWith('<')
    let initialHtml = ''
    if (isRawText) {
      initialHtml = (chapter.content || []).map(p => `<p class="mb-5 text-pretty">${p}</p>`).join('')
    } else {
      initialHtml = (chapter.content || []).join('')
    }

    setEditText(initialHtml)
    setEditorHtml(initialHtml)
    setLiveWordCount(countWords(initialHtml))

    const draftKey = `draft_${story.slug}_${chapter.number}`
    const savedDraft = typeof window !== 'undefined' ? localStorage.getItem(draftKey) : null
    if (savedDraft) {
      try {
        const { title: dTitle, content: dContent } = JSON.parse(savedDraft)
        if (dContent && dContent !== initialHtml && confirm("Hệ thống phát hiện có bản nháp tự động chưa được lưu lên máy chủ từ lần soạn thảo trước. Bạn có muốn phục hồi không?")) {
          setEditTitle(dTitle)
          setEditText(dContent)
          setEditorHtml(dContent)
          setLiveWordCount(countWords(dContent))
          initialHtml = dContent
        }
      } catch (e) {}
    }

    const historyKey = `history_${story.slug}_${chapter.number}`
    const savedHistory = typeof window !== 'undefined' ? localStorage.getItem(historyKey) : null
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)) } catch (e) {}
    } else {
      saveToHistory(chapter.title, initialHtml)
    }

    setIsEditing(true)
  }

  const handleRestoreVersion = (version: any) => {
    const timeStr = new Date(version.timestamp).toLocaleTimeString('vi-VN') + ' - ' + new Date(version.timestamp).toLocaleDateString('vi-VN')
    if (confirm(`Bạn có chắc chắn muốn khôi phục nội dung chương về phiên bản lúc ${timeStr} không?`)) {
      setEditTitle(version.title)
      setEditText(version.content)
      setEditorHtml(version.content)
      setLiveWordCount(version.wordCount)
      if (editorRef.current) editorRef.current.innerHTML = version.content
      setHistoryOpen(false)
    }
  }

  const handleTTS = () => {
    if (typeof window === 'undefined') return
    const synth = window.speechSynthesis
    if (!synth) {
      alert("Trình duyệt không hỗ trợ TTS.")
      return
    }
    if (synth.speaking) {
      if (synth.paused) { synth.resume(); setIsSpeaking(true) }
      else { synth.pause(); setIsSpeaking(false) }
      return
    }
    const readerBody = document.getElementById('reader-body')
    if (!readerBody) return
    const utterance = new SpeechSynthesisUtterance(readerBody.innerText)
    const viVoice = synth.getVoices().find(v => v.lang.toLowerCase().replace('_', '-').includes('vi'))
    if (viVoice) {
      utterance.voice = viVoice
    } else {
      utterance.lang = 'vi-VN'
    }
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    synth.speak(utterance)
    setIsSpeaking(true)
  }

  function goTo(n: number) {
    router.push(`/truyen/${story.slug}/${n}`)
  }

  const handleSave = async () => {
    setIsSaving(true)
    const editor = editorRef.current
    if (editor) {
      cleanMarker()
      const finalHtml = editor.innerHTML
      const res = await updateChapterContent(story.slug, chapter.number, finalHtml, editTitle)
      if (res.success) {
        localStorage.removeItem(`draft_${story.slug}_${chapter.number}`)
        saveToHistory(editTitle, finalHtml)
        setIsEditing(false); setIsZenEditing(false); router.refresh()
      } else alert("Lỗi khi lưu: " + res.error)
    }
    setIsSaving(false)
  }

  // CÁC HÀM XỬ LÝ CHUỘT VÀ MENU CỦA EDITOR
  function saveCursorPosition() {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange()
    }
  }

  // 🌟 HÀM KHÔI PHỤC VỊ TRÍ CON TRỎ (ĐÃ SỬA CHỐNG LỖI)
  function restoreCursorPosition() {
    const editor = editorRef.current
    if (editor) {
      editor.focus()
      if (savedRangeRef.current) {
        const selection = window.getSelection()
        selection?.removeAllRanges()
        selection?.addRange(savedRangeRef.current)
      }
    }
  }

  function handleSelection() {
    if (!isEditing) return
    saveCursorPosition()
  }

  function handleContextMenu(e: React.MouseEvent) {
    if (!isEditing) return
    e.preventDefault()
    saveCursorPosition()
    setContextMenuPosition({ top: e.clientY, left: e.clientX })
    setContextMenuVisible(true)
  }

  function cleanMarker() {
    const marker = document.getElementById('MAGIC_MARKER')
    if (marker) {
      marker.remove()
      const editor = editorRef.current
      if (editor) {
        setEditText(editor.innerHTML)
        setEditorHtml(editor.innerHTML)
      }
    }
  }

  function executeCommand(command: string, value: string = '') {
    const editor = editorRef.current
    if (!editor) return

    if (command === 'insertImage') {
      const placeholder = document.getElementById('img-temp-placeholder')
      if (placeholder) {
        placeholder.outerHTML = `<br/><br/><img src="${value}" class="max-w-full mx-auto rounded-xl my-6 shadow-md" /><br/><br/>`
      } else {
        editor.focus()
        editor.innerHTML += `<br/><br/><img src="${value}" class="max-w-full mx-auto rounded-xl my-6 shadow-md" /><br/><br/>`
      }
    } else {
      document.execCommand(command, false, value)
    }

    setEditText(editor.innerHTML)
    setEditorHtml(editor.innerHTML)
    setLiveWordCount(countWords(editor.innerHTML))
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) { cleanMarker(); return }
    if (file.size > 5 * 1024 * 1024) { alert("Ảnh quá nặng (vượt quá 5MB)!"); cleanMarker(); return }

    setIsUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64Url = event.target?.result as string
        const editor = editorRef.current
        const marker = document.getElementById('MAGIC_MARKER')
        
        if (marker) marker.outerHTML = `<br/><br/><img src="${base64Url}" class="max-w-full mx-auto rounded-xl my-6 shadow-md" /><br/><br/>`
        else if (editor) editor.innerHTML += `<br/><br/><img src="${base64Url}" class="max-w-full mx-auto rounded-xl my-6 shadow-md" /><br/><br/>`

        if (editor) {
          setEditText(editor.innerHTML)
          setEditorHtml(editor.innerHTML)
          setLiveWordCount(countWords(editor.innerHTML))
        }
        setIsUploading(false)
      }
      reader.onerror = () => { alert("Lỗi khi đọc file!"); cleanMarker(); setIsUploading(false) }
      reader.readAsDataURL(file)
    } catch (error) {
      alert("Sự cố tải ảnh!")
      cleanMarker(); setIsUploading(false)
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleEditorInput = (html: string) => {
    setEditorHtml(html)
    setLiveWordCount(countWords(html))
  }

  const handleSendParaComment = async () => {
    const finalName = user?.fullName || user?.username || 'Khách ẩn danh'
    const senderAvatar = user?.imageUrl || ''
    const dbSenderName = senderAvatar ? `${finalName} ||USER_ID||:${user?.id} ||AVATAR_URL||:${senderAvatar}` : `${finalName} ||USER_ID||:${user?.id}`
    const textToSend = commentText.trim()
    if (!textToSend && !commentImgUrl) { alert("Vui lòng nhập bình luận!"); return }
    setIsSending(true)
    const dbContent = commentImgUrl ? `${textToSend} ||IMAGE_URL||:${commentImgUrl}` : textToSend
    try {
      const res = await addParagraphComment(story.slug, chapter.number, activeParaIndex, dbSenderName, dbContent)
      if (res.success) {
        setCommentText(''); setCommentImgUrl('')
        const list = await getParagraphComments(story.slug, chapter.number, activeParaIndex)
        setParaComments(list); loadCommentCounts()
      } else alert("Lỗi gửi bình luận: " + res.error)
    } finally { setIsSending(false) }
  }

  const handleSendChapterComment = async () => {
    if (!isSignedIn || !user) { alert("Vui lòng đăng nhập!"); return }
    const textToSend = chapterCommentText.trim()
    if (!textToSend && !chapterCommentImgUrl) return

    setIsSending(true)
    const dbSenderName = user.imageUrl 
      ? `${user.fullName || user.username} ||USER_ID||:${user.id} ||AVATAR_URL||:${user.imageUrl}`
      : `${user.fullName || user.username} ||USER_ID||:${user.id}`

    const dbContent = chapterCommentImgUrl ? `${textToSend} ||IMAGE_URL||:${chapterCommentImgUrl}` : textToSend

    try {
      const res = await addParagraphComment(story.slug, chapter.number, -1, dbSenderName, dbContent, undefined)
      if (res.success) {
        setChapterCommentText('')
        setChapterCommentImgUrl('')
        loadChapterComments()
        loadCommentCounts()
      } else alert("Lỗi: " + res.error)
    } catch (e) { console.error(e) } finally { setIsSending(false) }
  }

  const handleChapterStickerClick = async (stickerId: string) => {
    if (!isSignedIn || !user) { alert("Vui lòng đăng nhập!"); return }
    const previousComments = [...chapterComments]
    const isSelected = chapterUserReactions.includes(stickerId)
    let updatedComments = [...chapterComments]

    if (isSelected) {
      updatedComments = updatedComments.filter(comm => {
        const idParts = (comm.sender_name || '').split(' ||USER_ID||:')
        return !((idParts[1] || '').split(' ||AVATAR_URL||:')[0] === user.id && comm.reaction === stickerId && comm.paragraph_index === -1)
      })
    } else {
      updatedComments.push({
        id: -Date.now(),
        sender_name: `${user.fullName || user.username} ||USER_ID||:${user.id} ||AVATAR_URL||:${user.imageUrl}`,
        content: '||DISCORD_REACTION||',
        reaction: stickerId,
        paragraph_index: -1,
        created_at: new Date().toISOString()
      })
    }
    setChapterComments(updatedComments)

    try {
      const existing = previousComments.find(comm => {
        const idParts = (comm.sender_name || '').split(' ||USER_ID||:')
        return (idParts[1] || '').split(' ||AVATAR_URL||:')[0] === user.id && comm.reaction === stickerId && comm.paragraph_index === -1
      })
      if (existing) {
        await deleteParagraphComment(existing.id); loadChapterComments(); loadCommentCounts()
      } else {
        const dbSenderName = `${user.fullName || user.username} ||USER_ID||:${user.id} ||AVATAR_URL||:${user.imageUrl}`
        await addParagraphComment(story.slug, chapter.number, -1, dbSenderName, '||DISCORD_REACTION||', stickerId)
        loadChapterComments(); loadCommentCounts()
      }
    } catch (err) { setChapterComments(previousComments) }
  }

  const handleSendReplyGeneral = async (parentId: number, isChapterArea: boolean) => {
    if (!isSignedIn || !user) { alert("Vui lòng đăng nhập để phản hồi bình luận!"); return }
    const currentReplyText = isChapterArea ? chapterReplyText : replyText
    const textToSend = currentReplyText.trim()
    if (!textToSend) return

    setIsSending(true)
    const dbSenderName = user.imageUrl 
      ? `${user.fullName || user.username} ||USER_ID||:${user.id} ||AVATAR_URL||:${user.imageUrl}`
      : `${user.fullName || user.username} ||USER_ID||:${user.id}`
    const dbContent = `${textToSend} ||PARENT_ID||:${parentId}`

    try {
      const res = await addParagraphComment(story.slug, chapter.number, isChapterArea ? -1 : activeParaIndex, dbSenderName, dbContent, undefined)
      if (res.success) {
        if (isChapterArea) {
          setChapterReplyText('')
          setChapterReplyingToId(null)
          loadChapterComments()
          if (!chapterExpandedCommentIds.includes(parentId)) setChapterExpandedCommentIds([...chapterExpandedCommentIds, parentId])
        } else {
          setReplyText('')
          setReplyingToId(null)
          const list = await getParagraphComments(story.slug, chapter.number, activeParaIndex)
          setParaComments(list)
          if (!expandedCommentIds.includes(parentId)) setExpandedCommentIds([...expandedCommentIds, parentId])
        }
      } else alert("Lỗi gửi phản hồi: " + res.error)
    } catch (e) { console.error(e) } finally { setIsSending(false) }
  }

  // 🌟 DÙNG HÀM TẢI ẢNH MỚI CHO NGƯỜI DÙNG (BỎ CHECK ADMIN)
  const handleCommentImageUploadGeneral = async (e: React.ChangeEvent<HTMLInputElement>, isChapterArea: boolean) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) { alert("Ảnh đính kèm bình luận tối đa 3MB!"); return }

    if (isChapterArea) setIsUploadingChapterCommentImg(true); else setIsUploadingCommentImg(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await uploadCommentImage(formData) // <-- GỌI HÀM NÀY MỚI ĐÚNG
      if (res.success && res.url) {
        if (isChapterArea) setChapterCommentImgUrl(res.url); else setCommentImgUrl(res.url)
      } else alert("Lỗi khi tải ảnh: " + res.error)
    } catch (err) {
      alert("Lỗi tải tệp tin lên hệ thống.")
    } finally {
      if (isChapterArea) setIsUploadingChapterCommentImg(false); else setIsUploadingCommentImg(false)
      if (isChapterArea && chapterCommentFileInputRef.current) chapterCommentFileInputRef.current.value = ""
      else if (commentFileInputRef.current) commentFileInputRef.current.value = ""
    }
  }

  // 🌟 KHÔI PHỤC HOÀN TOÀN HÀM XỬ LÝ CLICK NHÃN DÂN ĐOẠN VĂN (ĐÃ SỬA CHỐNG LỖI) [2]
  const handleStickerClick = async (stickerId: string) => {
    if (!isSignedIn || !user) {
      alert("Vui lòng đăng nhập!")
      return
    }
    const previousComments = [...paraComments]
    const isSelected = userReactions.includes(stickerId)
    let updatedComments = [...paraComments]

    if (isSelected) {
      updatedComments = updatedComments.filter(comm => {
        const idParts = (comm.sender_name || '').split(' ||USER_ID||:')
        return !((idParts[1] || '').split(' ||AVATAR_URL||:')[0] === user.id && comm.reaction === stickerId)
      })
    } else {
      updatedComments.push({
        id: -Date.now(),
        sender_name: `${user.fullName || user.username} ||USER_ID||:${user.id} ||AVATAR_URL||:${user.imageUrl}`,
        content: '||DISCORD_REACTION||',
        reaction: stickerId,
        created_at: new Date().toISOString()
      })
    }
    setParaComments(updatedComments)

    try {
      const existing = previousComments.find(comm => {
        const idParts = (comm.sender_name || '').split(' ||USER_ID||:')
        return (idParts[1] || '').split(' ||AVATAR_URL||:')[0] === user.id && comm.reaction === stickerId
      })
      if (existing) {
        const res = await deleteParagraphComment(existing.id)
        if (!res.success) { 
          setParaComments(previousComments)
          alert("Lỗi: " + res.error) 
        } else { 
          const list = await getParagraphComments(story.slug, chapter.number, activeParaIndex)
          setParaComments(list)
          loadCommentCounts() 
        }
      } else {
        const dbSenderName = `${user.fullName || user.username} ||USER_ID||:${user.id} ||AVATAR_URL||:${user.imageUrl}`
        const res = await addParagraphComment(story.slug, chapter.number, activeParaIndex, dbSenderName, '||DISCORD_REACTION||', stickerId)
        if (!res.success) { 
          setParaComments(previousComments)
          alert("Lỗi: " + res.error) 
        } else { 
          const list = await getParagraphComments(story.slug, chapter.number, activeParaIndex)
          setParaComments(list)
          loadCommentCounts() 
        }
      }
    } catch (err) { 
      setParaComments(previousComments) 
    }
  }

  const handleCommentImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { handleCommentImageUploadGeneral(e, false) }
  const handleChapterCommentImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { handleCommentImageUploadGeneral(e, true) }

  const handleOpenParaComment = async (index: number, rawText: string) => {
    setActiveParaIndex(index)
    setActiveParaText(rawText)
    setParaCommentOpen(true)
    setIsLoadingComments(true)
    setCommentImgUrl('')
    setEditingCommentId(null)

    try {
      const list = await getParagraphComments(story.slug, chapter.number, index)
      setParaComments(list || [])
    } catch (error) {
      console.error("Lỗi khi tải bình luận:", error)
    } finally {
      setIsLoadingComments(false)
    }
  }

  const handleStartCommentEdit = (id: number, currentText: string) => { setEditingCommentId(id); setEditingCommentText(currentText) }

  const handleSaveCommentEdit = async (id: number) => {
    if (!editingCommentText.trim()) return
    setIsSending(true)
    try {
      const original = paraComments.find(c => c.id === id) || chapterComments.find(c => c.id === id)
      const imgPart = (original?.content || '').split(' ||IMAGE_URL||:')[1]
      const finalContent = imgPart ? `${editingCommentText.trim()} ||IMAGE_URL||:${imgPart}` : editingCommentText.trim()
      const res = await updateParagraphComment(id, finalContent)
      if (res.success) { 
        setEditingCommentId(null)
        const list = await getParagraphComments(story.slug, chapter.number, activeParaIndex)
        setParaComments(list)
        loadChapterComments()
      }
      else alert("Lỗi: " + res.error)
    } finally { setIsSending(false) }
  }

  const handleDeleteComment = async (id: number) => {
    if (!confirm("Xóa bình luận này?")) return
    setIsSending(true)
    try {
      const res = await deleteParagraphComment(id)
      if (res.success) { 
        const list = await getParagraphComments(story.slug, chapter.number, activeParaIndex)
        setParaComments(list)
        loadCommentCounts()
        loadChapterComments()
      }
      else alert("Lỗi: " + res.error)
    } finally { setIsSending(false) }
  }

  const handleSendReply = async (parentId: number) => {
    handleSendReplyGeneral(parentId, false)
  }

  const handleSendChapterReply = async (parentId: number) => {
    handleSendReplyGeneral(parentId, true)
  }

  const toggleExpanded = (id: number) => {
    if (expandedCommentIds.includes(id)) setExpandedCommentIds(expandedCommentIds.filter(x => x !== id))
    else setExpandedCommentIds([...expandedCommentIds, id])
  }
  const toggleChapterExpanded = (id: number) => {
    if (chapterExpandedCommentIds.includes(id)) setChapterExpandedCommentIds(chapterExpandedCommentIds.filter(x => x !== id))
    else setChapterExpandedCommentIds([...chapterExpandedCommentIds, id])
  }

  const sortedStickers = useMemo(() => {
    const counts: Record<string, number> = {}
    paraComments.forEach(comm => { if (comm.reaction) counts[comm.reaction] = (counts[comm.reaction] || 0) + 1 })
    return [...KLEIN_STICKERS].sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0))
  }, [paraComments])

  const userReactions = useMemo(() => {
    if (!isSignedIn || !user) return []
    return paraComments.filter(comm => (comm.sender_name || '').split(' ||USER_ID||:')[1]?.split(' ||AVATAR_URL||:')[0] === user.id).map(comm => comm.reaction)
  }, [paraComments, isSignedIn, user])

  const chapterUserReactions = useMemo(() => {
    if (!isSignedIn || !user) return []
    return chapterComments.filter(comm => (comm.sender_name || '').split(' ||USER_ID||:')[1]?.split(' ||AVATAR_URL||:')[0] === user.id && comm.paragraph_index === -1).map(comm => comm.reaction)
  }, [chapterComments, isSignedIn, user])

  const textComments = useMemo(() => paraComments.filter(c => c.content && c.content !== '||DISCORD_REACTION||'), [paraComments])

  const parsedParagraphs = useMemo(() => {
    if (!chapter.content || chapter.content.length === 0) return []
    const first = chapter.content[0]
    if (chapter.content.length === 1 && (first.includes('<p') || first.includes('<div'))) {
      const matches = first.match(/<(p|div|img|hr|h2|blockquote)[^>]*>([\s\S]*?)<\/\1>|<(img|hr)[^>]*\/?>/gi)
      if (matches && matches.length > 0) return matches
    }
    return chapter.content
  }, [chapter.content])

  const Nav = ({ className }: { className?: string }) => (
    <div className={cn('flex items-center justify-between gap-2', className)}>
      <Button 
        variant="outline" 
        disabled={!hasPrev} 
        onClick={() => hasPrev && goTo(chapter.number - 1)}
        className={cn("h-10 px-4 transition-all duration-200 font-semibold", THEME_MAPPING[readerTheme]?.navBtn)}
      >
        <ChevronLeft className="size-4 mr-1 shrink-0" /> Chương trước
      </Button>
      <Select value={String(chapter.number)} onValueChange={(v) => goTo(Number(v))}>
        <SelectTrigger className={cn("w-[150px] h-10 font-semibold transition-all duration-200 focus:ring-0", THEME_MAPPING[readerTheme]?.navBtn)}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className={cn("max-h-72 border", THEME_MAPPING[readerTheme]?.container)}>
          {story.chapters.map((c) => (
            <SelectItem 
              key={c.number} 
              value={String(c.number)}
              className={cn(
                "cursor-pointer transition-colors duration-150",
                readerTheme === 'light' && "focus:!bg-[#F4EEE6] focus:!text-[#5C3D2E] data-[state=checked]:!bg-[#F4EEE6] data-[state=checked]:!text-[#5C3D2E]",
                readerTheme === 'dark' && "focus:!bg-stone-850/80 focus:!text-stone-100 data-[state=checked]:!bg-stone-800 dark:data-[state=checked]:!bg-stone-800 data-[state=checked]:!text-stone-100",
                readerTheme === 'sepia' && "focus:!bg-[#EADBC8] focus:!text-[#5C3D2E] data-[state=checked]:!bg-[#EADBC8] data-[state=checked]:!text-[#5C3D2E]",
                readerTheme === 'emerald' && "focus:!bg-[#DDE6D5] focus:!text-[#3B4D31] data-[state=checked]:!bg-[#DDE6D5] data-[state=checked]:!text-[#3B4D31]",
                readerTheme === 'coffee' && "focus:!bg-[#E0D2C8] focus:!text-[#4A3228] data-[state=checked]:!bg-[#E0D2C8] data-[state=checked]:!text-[#4A3228]",
                readerTheme === 'rose' && "focus:!bg-[#F9E2E5] focus:!text-[#632B30] data-[state=checked]:!bg-[#F9E2E5] data-[state=checked]:!text-[#632B30]"
              )}
            >
              Chương {c.number}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button 
        variant="outline" 
        disabled={!hasNext} 
        onClick={() => hasNext && goTo(chapter.number + 1)}
        className={cn("h-10 px-4 transition-all duration-200 font-semibold", THEME_MAPPING[readerTheme]?.navBtn)}
      >
        Chương sau <ChevronRight className="size-4 ml-1 shrink-0" />
      </Button>
    </div>
  )

  return (
    <div className="relative">
      {/* 🌟 MÀNG TÀNG HÌNH MENU CHUỘT PHẢI ĐÃ KHÔI PHỤC */}
      {contextMenuVisible && (
        <div className="fixed inset-0 z-[85]" onClick={() => setContextMenuVisible(false)} onContextMenu={(e) => { e.preventDefault(); setContextMenuVisible(false) }} />
      )}

      {/* 🌟 MENU CHUỘT PHẢI CỦA TRÌNH SOẠN THẢO ĐÃ KHÔI PHỤC */}
      {contextMenuVisible && (
        <div onClick={(e) => e.stopPropagation()} onContextMenu={(e) => e.stopPropagation()} className="fixed z-[95] flex flex-col bg-stone-950 text-stone-100 py-1.5 rounded-xl shadow-2xl border border-stone-800 w-52 text-sm font-sans" style={{ top: `${contextMenuPosition.top}px`, left: `${contextMenuPosition.left}px` }}>
          <button type="button" onClick={() => { restoreCursorPosition(); document.execCommand('insertHTML', false, '<span id="MAGIC_MARKER"></span>'); fileInputRef.current?.click(); setContextMenuVisible(false) }} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-stone-900 text-left w-full text-amber-400 font-semibold">
            <Upload className="size-4 shrink-0" /> Tải ảnh từ máy
          </button>
          <button type="button" onClick={() => { setContextMenuVisible(false); setTimeout(() => { const url = prompt("Nhập URL ảnh:"); if (url) { restoreCursorPosition(); document.execCommand('insertHTML', false, `<br/><br/><img src="${url}" class="max-w-full mx-auto rounded-xl my-6 shadow-md" /><br/><br/>`); const editor = editorRef.current; if (editor) setEditText(editor.innerHTML) } }, 100) }} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-stone-900 text-left w-full text-stone-200">
            <ImageIconLucide className="size-4 shrink-0" /> Chèn ảnh URL
          </button>
          <div className="h-px bg-stone-800 my-1.5 mx-3" />
          <button type="button" onClick={() => { setContextMenuVisible(false); if (confirm("Xóa sạch toàn bộ nội dung?")) { const editor = editorRef.current; if (editor) editor.innerHTML = "" } }} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-stone-900 text-left w-full text-red-400">
            <X className="size-4 shrink-0" /> Xóa sạch nội dung
          </button>
        </div>
      )}

      <article
        className={cn(
          "mx-auto w-full transition-all duration-300 relative border shadow-lg p-6 md:p-8 rounded-2xl",
          containerWidth === 'xl' && "max-w-xl",
          containerWidth === '2xl' && "max-w-2xl",
          containerWidth === '3xl' && "max-w-3xl",
          THEME_MAPPING[readerTheme]?.container,
          THEME_MAPPING[readerTheme]?.text
        )}
      >
        <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;700&family=Lexend:wght@400;600;700&family=Manrope:wght@400;600;700&family=Nunito:wght@400;600;700&family=Quicksand:wght@400;600;700&display=swap');` }} />

        {/* Toolbar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/truyen/${story.slug}`}><List className="size-4" /> Mục lục</Link>
            </Button>
            {isAdmin && !isEditing && (
              <Button onClick={startEditing} variant="outline" size="sm" className="text-amber-800 dark:text-amber-400 gap-1.5 border-amber-800/30">
                <Edit className="size-4" /> Sửa chương này
              </Button>
            )}
          </div>

          <ReaderToolbar
            settingsOpen={settingsOpen}
            setSettingsOpen={setSettingsOpen}
            isSpeaking={isSpeaking}
            handleTTS={handleTTS}
            readerTheme={readerTheme}
            setReaderTheme={changeReaderTheme}
            fontSize={fontSize}
            setFontSize={(val) => { if (typeof val === 'function') { changeFontSize(val(fontSize)) } else { changeFontSize(val) } }}
            fontFamily={fontFamily}
            setFontFamily={changeFontFamily}
            lineHeight={lineHeight}
            setLineHeight={changeLineHeight}
            containerWidth={containerWidth}
            setContainerWidth={changeContainerWidth}
          />
        </div>

        <header className="mb-6 text-center">
          <Link href={`/truyen/${story.slug}`} className="text-sm font-semibold text-primary hover:underline">{story.title}</Link>
          <h1 className="mt-2 font-serif text-2xl font-bold md:text-3xl">{chapter.title}</h1>
        </header>

        <Nav className="mb-8" />

        {isEditing ? (
          <AdminEditor
            isZenEditing={isZenEditing}
            setIsZenEditing={setIsZenEditing}
            editTitle={editTitle}
            setEditTitle={setEditTitle}
            isSaving={isSaving}
            isUploading={isUploading}
            saveStatus={saveStatus}
            liveWordCount={liveWordCount}
            fontSize={fontSize}
            history={history}
            historyOpen={historyOpen}
            setHistoryOpen={setHistoryOpen}
            editorRef={editorRef}
            fileInputRef={fileInputRef}
            handleImageUpload={handleImageUpload}
            executeCommand={executeCommand}
            handleRestoreVersion={handleRestoreVersion}
            handleSave={handleSave}
            setIsEditing={setIsEditing}
            POPUP_THEME_MAPPING={POPUP_THEME_MAPPING}
            readerTheme={readerTheme}
            handleContextMenu={handleContextMenu}
            handleSelection={handleSelection}
            handleInput={handleEditorInput}
          />
        ) : (
          <div
            id="reader-body"
            className={cn(
              "flex flex-col [&_img]:max-w-full [&_img]:mx-auto [&_img]:rounded-xl [&_img]:shadow-md [&_p]:mb-1 text-pretty",
              fontFamily === 'serif' ? 'font-serif' : '',
              lineHeight === 'normal' && "leading-normal gap-4 [&_p]:mb-4 [&_img]:my-4",
              lineHeight === 'relaxed' && "leading-relaxed gap-6 [&_p]:mb-6 [&_img]:my-6",
              lineHeight === 'loose' && "leading-loose gap-8 [&_p]:mb-8 [&_img]:my-8"
            )}
            style={{ fontSize, fontFamily: FONT_MAPPING[fontFamily] || "inherit" }}
          >
            {parsedParagraphs.map((p, i) => {
              const isHtml = p.trim().startsWith('<') || p.includes('<' + '/') || p.includes('<img')
              const rawText = p.replace(new RegExp('</?[^>]+(>|$)', 'g'), '').trim()
              const count = paraCommentCounts[i] || 0

              return (
                <div key={i} className="relative group/para flex items-start gap-3 py-1">
                  <div className="flex-1 animate-fade-in">
                    {isHtml ? <div dangerouslySetInnerHTML={{ __html: p }} className="text-pretty" /> : <p className="text-pretty">{p}</p>}
                  </div>
                  <button
                    onClick={() => handleOpenParaComment(i, rawText)}
                    className={cn(
                      "transition-all duration-200 flex items-center justify-center border shrink-0 self-center rounded-full p-1 shadow-sm active:scale-90 w-11 h-9 relative",
                      count > 0 ? "opacity-95 hover:opacity-100" : "opacity-0 group-hover/para:opacity-100",
                      KLEIN_BTN_THEME[readerTheme] || "bg-[#F4EEE6] border-[#E5D8C8] text-[#5C3D2E]"
                    )}
                    title={`Xem ${count} bình luận`}
                  >
                    <img src="/klein.png" alt="Bình luận" className="w-8 h-6 object-contain dark:brightness-125 dark:drop-shadow-[0_0_3px_rgba(255,255,255,0.4)]" />
                    {count > 0 && (
                      <span className={cn("absolute -top-1.5 -right-1.5 text-[9px] font-bold h-4.5 min-w-4.5 px-1 rounded-full flex items-center justify-center border shadow-sm animate-fade-in scale-90 select-none", THEME_MAPPING[readerTheme]?.badge || "bg-[#8B5E3C] text-white")}>
                        {count}
                      </span>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        <Nav className="mt-10" />

        {!isEditing && (
          <ChapterComments
            chapterComments={chapterComments}
            isLoading={isLoadingChapterComments}
            isSending={isSending}
            isUploadingCommentImg={isUploadingChapterCommentImg}
            commentText={chapterCommentText}
            setCommentText={setChapterCommentText}
            commentImgUrl={chapterCommentImgUrl}
            setCommentImgUrl={setChapterCommentImgUrl}
            commentFileInputRef={chapterCommentFileInputRef}
            handleCommentImageUpload={handleChapterCommentImageUpload}
            handleStickerClick={handleChapterStickerClick}
            handleSendChapterComment={handleSendChapterComment}
            userReactions={chapterUserReactions}
            sortedStickers={sortedStickers}
            parsedParagraphs={parsedParagraphs}
            editingCommentId={editingCommentId}
            editingCommentText={editingCommentText}
            setEditingCommentText={setEditingCommentText}
            handleStartCommentEdit={handleStartCommentEdit}
            handleSaveCommentEdit={handleSaveCommentEdit}
            handleDeleteComment={handleDeleteComment}
            isSignedIn={isSignedIn}
            user={user}
            isAdmin={isAdmin}
            POPUP_THEME_MAPPING={POPUP_THEME_MAPPING}
            readerTheme={readerTheme}
            replyingToId={chapterReplyingToId}
            setReplyingToId={setChapterReplyingToId}
            replyText={chapterReplyText}
            setReplyText={setChapterReplyText}
            handleSendReply={handleSendChapterReply}
            expandedCommentIds={chapterExpandedCommentIds}
            toggleExpanded={toggleChapterExpanded}
          />
        )}

        <ParagraphComments
          paraCommentOpen={paraCommentOpen}
          setParaCommentOpen={setParaCommentOpen}
          activeParaText={activeParaText}
          sortedStickers={sortedStickers}
          paraComments={paraComments}
          userReactions={userReactions}
          textComments={textComments}
          isLoadingComments={isLoadingComments}
          isSending={isSending}
          isUploadingCommentImg={isUploadingCommentImg}
          commentText={commentText}
          setCommentText={setCommentText}
          commentImgUrl={commentImgUrl}
          setCommentImgUrl={setCommentImgUrl}
          commentFileInputRef={commentFileInputRef}
          handleCommentImageUpload={handleCommentImageUpload}
          handleStickerClick={handleStickerClick}
          handleSendParaComment={handleSendParaComment}
          editingCommentId={editingCommentId}
          editingCommentText={editingCommentText}
          setEditingCommentText={setEditingCommentText}
          handleStartCommentEdit={handleStartCommentEdit}
          handleSaveCommentEdit={handleSaveCommentEdit}
          handleDeleteComment={handleDeleteComment}
          isSignedIn={isSignedIn}
          user={user}
          isAdmin={isAdmin}
          POPUP_THEME_MAPPING={POPUP_THEME_MAPPING}
          readerTheme={readerTheme}
          replyingToId={replyingToId}
          setReplyingToId={setReplyingToId}
          replyText={replyText}
          setReplyText={setReplyText}
          handleSendReply={handleSendReply}
          expandedCommentIds={expandedCommentIds}
          toggleExpanded={toggleExpanded}
        />
      </article>
    </div>
  )
}