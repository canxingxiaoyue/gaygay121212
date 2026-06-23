'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Upload, Image as ImageIconLucide, Plus, FileText, Minimize2, Maximize2,
  History as HistoryIcon, Loader2, X, Save
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminEditorProps {
  isZenEditing: boolean
  setIsZenEditing: (zen: boolean) => void
  editTitle: string
  setEditTitle: (title: string) => void
  isSaving: boolean
  isUploading: boolean
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  liveWordCount: number
  fontSize: number
  history: any[]
  historyOpen: boolean
  setHistoryOpen: (open: boolean) => void
  editorRef: React.RefObject<HTMLDivElement | null>
  fileInputRef: React.RefObject<HTMLInputElement | null>
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  executeCommand: (cmd: string, val?: string) => void
  handleRestoreVersion: (version: any) => void
  handleSave: () => void
  setIsEditing: (editing: boolean) => void
  POPUP_THEME_MAPPING: any
  readerTheme: string
  // 🌟 CÁC PROPS LIÊN KẾT EVENT CỦA CHUỘT VÀ BÀN PHÍM
  handleContextMenu: (e: React.MouseEvent) => void
  handleSelection: () => void
  handleInput: (html: string) => void
}

export function AdminEditor({
  isZenEditing, setIsZenEditing, editTitle, setEditTitle, isSaving, isUploading, saveStatus,
  liveWordCount, fontSize, history, historyOpen, setHistoryOpen, editorRef, fileInputRef,
  handleImageUpload, executeCommand, handleRestoreVersion, handleSave, setIsEditing,
  POPUP_THEME_MAPPING, readerTheme,
  handleContextMenu, handleSelection, handleInput
}: AdminEditorProps) {
  return (
    <div className={cn("transition-all duration-300 relative", isZenEditing ? "fixed inset-0 bg-[#FFFDFB] dark:bg-stone-950 z-[200] p-6 md:p-12 overflow-y-auto flex flex-col justify-start" : "space-y-4")}>
      <div className={cn("space-y-4 w-full flex-1 flex flex-col", isZenEditing && "max-w-3xl mx-auto")}>
        <div>
          <label className="text-xs font-semibold text-stone-500">Tên chương truyện:</label>
          <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="mt-1 font-serif text-lg font-bold border-amber-800/20 bg-amber-50/10 focus-visible:ring-amber-500" disabled={isSaving} />
        </div>

        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

        <div className="flex flex-col border border-amber-800/20 rounded-xl overflow-hidden shadow-md">
          {/* Format Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 bg-[#FBF9F6] dark:bg-stone-900 border-b border-amber-800/15 p-2">
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="icon" onClick={() => executeCommand('bold')} className="size-8 text-[#5C3D2E] dark:text-stone-300" title="Bôi đậm"><Bold className="size-4" /></Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => executeCommand('italic')} className="size-8 text-[#5C3D2E] dark:text-stone-300" title="In nghiêng"><Italic className="size-4" /></Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => executeCommand('underline')} className="size-8 text-[#5C3D2E] dark:text-stone-300" title="Gạch chân"><Underline className="size-4" /></Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => executeCommand('strikeThrough')} className="size-8 text-[#5C3D2E] dark:text-stone-300" title="Gạch ngang"><Strikethrough className="size-4" /></Button>
            </div>

            <div className="h-4 w-px bg-stone-200 dark:bg-stone-800 hidden sm:block" />

            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="icon" onClick={() => executeCommand('justifyLeft')} className="size-8 text-[#5C3D2E] dark:text-stone-300" title="Căn lề trái"><AlignLeft className="size-4" /></Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => executeCommand('justifyCenter')} className="size-8 text-[#5C3D2E] dark:text-stone-300" title="Căn lề giữa"><AlignCenter className="size-4" /></Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => executeCommand('justifyRight')} className="size-8 text-[#5C3D2E] dark:text-stone-300" title="Căn lề phải"><AlignRight className="size-4" /></Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => executeCommand('justifyFull')} className="size-8 hover:bg-[#F4EEE6] dark:hover-[#E5D8C8] rounded-lg" title="Căn lề đều hai bên"><AlignJustify className="size-4" /></Button>
            </div>

            <div className="h-4 w-px bg-stone-200 dark:bg-stone-800 hidden sm:block" />

            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="size-8 text-[#5C3D2E] dark:text-stone-300" title="Chèn ảnh từ máy"><Upload className="size-4" /></Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => { const url = prompt("Nhập URL hình ảnh minh họa:"); if (url) executeCommand('insertImage', url) }} className="size-8 text-[#5C3D2E] dark:text-stone-300" title="Chèn ảnh URL"><ImageIconLucide className="size-4" /></Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => executeCommand('insertHorizontalRule')} className="size-8 text-[#5C3D2E] dark:text-stone-300" title="Chèn đường phân đoạn"><Plus className="size-4" /></Button>
            </div>

            <div className="h-4 w-px bg-stone-200 dark:bg-stone-800 hidden sm:block" />

            <div className="flex items-center gap-1.5 ml-auto">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 select-none">
                {saveStatus === 'saving' && <><Loader2 className="size-3.5 animate-spin text-amber-600" /><span className="text-amber-600">Đang lưu...</span></>}
                {saveStatus === 'saved' && <><span className="w-2 h-2 bg-green-500 rounded-full" /><span className="text-stone-400">Đã lưu nháp</span></>}
                {saveStatus === 'error' && <><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /><span className="text-red-500">Lỗi lưu</span></>}
                {saveStatus === 'idle' && <><span className="w-2 h-2 bg-stone-300 rounded-full" /><span>Sẵn sàng</span></>}
              </span>

              <div className="h-4 w-px bg-stone-200 dark:bg-stone-800" />

              <div className="relative">
                <Button type="button" variant="ghost" size="sm" onClick={() => setHistoryOpen(!historyOpen)} className="h-8 text-xs gap-1.5 text-[#5C3D2E] dark:text-stone-300 font-bold">
                  <HistoryIcon className="size-3.5" /> Lịch sử ({history.length})
                </Button>

                {historyOpen && (
                  <div className="absolute right-0 top-9 z-[110] w-72 max-h-80 overflow-y-auto rounded-xl border border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-3.5 shadow-2xl space-y-2 text-xs font-sans text-stone-700 dark:text-stone-300 animate-in fade-in zoom-in-95 duration-200">
                    <div className="font-bold border-b pb-2 mb-2 flex justify-between items-center text-stone-800 dark:text-stone-100">
                      <span>Lịch sử nháp ({history.length}/15)</span>
                      <button onClick={() => setHistoryOpen(false)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200">✕</button>
                    </div>
                    {history.length === 0 ? (
                      <div className="text-center text-stone-400 py-4 italic">Chưa có bản ghi lịch sử nào.</div>
                    ) : (
                      <div className="space-y-1">
                        {history.map((ver, idx) => {
                          const timeStr = new Date(ver.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date(ver.timestamp).toLocaleDateString('vi-VN')
                          return (
                            <div key={idx} onClick={() => handleRestoreVersion(ver)} className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer border border-transparent hover:border-stone-200 dark:hover:border-stone-700 transition">
                              <div className="flex justify-between font-bold text-stone-800 dark:text-stone-200">
                                <span>{idx === 0 ? "Bản lưu gần nhất" : `Bản sao lưu #${history.length - idx}`}</span>
                                <span className="text-[10px] text-stone-400 font-normal">{ver.wordCount} từ</span>
                              </div>
                              <div className="text-[10px] text-stone-400 mt-0.5">{timeStr}</div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="h-4 w-px bg-stone-200 dark:bg-stone-800" />

              <span className="text-xs text-stone-400 font-semibold flex items-center gap-1 select-none">
                <FileText className="size-3.5" /> {liveWordCount} từ
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsZenEditing(!isZenEditing)} className="h-8 text-xs gap-1 text-[#8B5E3C] dark:text-amber-400 font-bold">
                {isZenEditing ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
                {isZenEditing ? 'Thoát' : 'Viết tập trung'}
              </Button>
            </div>
          </div>

          {/* 🌟 VÙNG SOẠN THẢO (ĐÃ LIÊN KẾT ĐẦY ĐỦ EVENT CHUỘT VÀ BÀN PHÍM) */}
          <div className="p-4 bg-[#FFFDFB] dark:bg-stone-950 min-h-[450px]">
            <div
              ref={editorRef}
              id="rich-editor"
              contentEditable
              suppressContentEditableWarning={true}
              onContextMenu={handleContextMenu}
              onMouseUp={handleSelection}
              onKeyUp={(e) => {
                handleSelection()
                handleInput(e.currentTarget.innerHTML)
              }}
              onInput={(e) => {
                handleInput(e.currentTarget.innerHTML)
              }}
              onClick={handleSelection}
              className="outline-none font-serif text-lg leading-loose min-h-[400px] w-full text-foreground/90 whitespace-pre-wrap focus:ring-0 [&_img]:max-w-full [&_img]:mx-auto [&_img]:rounded-xl [&_img]:my-8 [&_img]:shadow-md"
              style={{ fontSize }}
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-4">
          <Button onClick={() => { setIsEditing(false); setIsZenEditing(false); setHistoryOpen(false); }} variant="ghost" disabled={isSaving}><X className="size-4 mr-1.5" /> Hủy</Button>
          <Button onClick={handleSave} className="bg-[#8B5E3C] hover:bg-[#5C3D2E] text-white" disabled={isSaving || isUploading}>
            {isSaving || isUploading ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Save className="size-4 mr-1.5" />}
            {isUploading ? 'Đang tải ảnh...' : 'Lưu chương truyện'}
          </Button>
        </div>
      </div>
    </div>
  )
}