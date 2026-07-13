export const FONT_MAPPING: Record<string, string> = {
  serif: "Lora, Georgia, 'Times New Roman', serif",
  quicksand: "'Quicksand', sans-serif",
  nunito: "'Nunito', sans-serif",
  lexend: "'Lexend', sans-serif",
  comfortaa: "'Comfortaa', sans-serif",
  manrope: "'Manrope', sans-serif",
}

export const THEME_MAPPING: Record<string, { container: string; text: string; badge: string; navBtn: string; activeItem: string }> = {
  light: {
    container: "bg-[#FFFDFB] dark:bg-stone-900 border-stone-200/60 dark:border-stone-850",
    text: "text-stone-900 dark:text-stone-100",
    badge: "bg-[#8B5E3C] text-white border-white dark:border-stone-900",
    navBtn: "border-stone-200 bg-transparent text-stone-700 hover:bg-[#F4EEE6] hover:border-stone-300 transition-colors",
    activeItem: "bg-stone-200/60 text-stone-900 dark:bg-stone-800 dark:text-amber-400 font-bold" // 🌟 Màu xám dịu / vàng tối cho chế độ sáng mặc định
  },
  dark: {
    container: "bg-[#131110] border-stone-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
    text: "text-[#e7e5e4]",
    badge: "bg-[#EADBC8] text-stone-950 border-stone-950",
    navBtn: "border-stone-800 bg-transparent text-stone-300 hover:bg-stone-800 hover:border-stone-700 transition-colors",
    activeItem: "bg-stone-800 text-stone-100 font-bold" // 🌟 Màu tối sâu cho chế độ tối
  },
  sepia: {
    container: "bg-[#F4ECD8] border-[#EADBC8]",
    text: "text-[#5C3D2E]",
    badge: "bg-[#8B5E3C] text-[#F4ECD8] border-[#F4ECD8]",
    navBtn: "border-[#EADBC8] bg-transparent text-[#5C3D2E] hover:bg-[#EADBC8]/70 hover:border-[#DEC4B0] transition-colors",
    activeItem: "bg-[#EADBC8] text-[#5C3D2E] font-bold" // 🌟 Tông sepia đậm cổ điển
  },
  emerald: {
    container: "bg-[#EAEFE3] border-[#D2DAC3]",
    text: "text-[#3B4D31]",
    badge: "bg-[#3B4D31] text-[#EAEFE3] border-[#EAEFE3]",
    navBtn: "border-[#D2DAC3] bg-transparent text-[#3B4D31] hover:bg-[#DDE6D5]/70 hover:border-[#C8D3BE] transition-colors",
    activeItem: "bg-[#DDE6D5] text-[#3B4D31] font-bold" // 🌟 Tông xanh lục bảo đậm đà cho Trà Xanh
  },
  coffee: {
    container: "bg-[#F0E6DF] border-[#DECAC0]",
    text: "text-[#4A3228]",
    badge: "bg-[#4A3228] text-[#F0E6DF] border-[#F0E6DF]",
    navBtn: "border-[#DECAC0] bg-transparent text-[#4A3228] hover:bg-[#E0D2C8]/70 hover:border-[#D0BFAF] transition-colors",
    activeItem: "bg-[#E0D2C8] text-[#4A3228] font-bold" // 🌟 Tông nâu đất đậm cho Cà Phê
  },
  rose: {
    container: "bg-[#FDF0F2] border-[#F5D6D8]",
    text: "text-[#632B30]",
    badge: "bg-[#632B30] text-[#FDF0F2] border-[#FDF0F2]",
    navBtn: "border-[#F5D6D8] bg-transparent text-[#632B30] hover:bg-[#F9E2E5]/70 hover:border-[#EDCCD2] transition-colors",
    activeItem: "bg-[#F9E2E5] text-[#632B30] font-bold" // 🌟 Tông hồng đào đậm đà dễ thương cho Đào Ngọt
  }
}

export const KLEIN_BTN_THEME: Record<string, string> = {
  light: "bg-[#F4EEE6] border-[#E5D8C8] hover:bg-[#EADBCE] text-[#5C3D2E]",
  dark: "bg-stone-850/80 border-stone-800 hover:bg-stone-800 text-[#efebe9]",
  sepia: "bg-[#EADBC8]/70 border-[#DEC4B0] hover:bg-[#DEC4B0] text-[#5C3D2E]",
  emerald: "bg-[#DDE6D5] border-[#C8D3BE] hover:bg-[#C8D3BE] text-[#3B4D31]",
  coffee: "bg-[#E0D2C8] border-[#D0BFAF] hover:bg-[#D0BFAF] text-[#4A3228]",
  rose: "bg-[#F9E2E5] border-[#F5D6D8] hover:bg-[#EDCCD2] text-[#632B30]",
}

export const POPUP_THEME_MAPPING: Record<string, any> = {
  light: {
    container: "bg-[#FFFDFB] text-stone-900 border-stone-200/60 dark:border-stone-850",
    quote: "bg-[#F4EEE6]/50 border-[#E5D8C8]/40 text-stone-500",
    input: "border-stone-200 bg-[#FFFDFB] focus-visible:ring-amber-500",
    text: "text-stone-700 dark:text-stone-300",
    button: "hover:bg-[#F4EEE6] text-[#5C3D2E]",
    reactionBg: "bg-[#F4EEE6]/40 border-[#E5D8C8]/40",
    activeEmoji: "bg-[#8B5E3C] border-[#8B5E3C] text-white shadow-[0_0_15px_rgba(139,94,60,0.3)] scale-[1.03]",
    sendBtn: "bg-[#8B5E3C] hover:bg-[#5C3D2E] text-white shadow-[0_4px_10px_rgba(139,94,60,0.15)]",
    close: "text-stone-400 hover:text-stone-700 dark:hover:text-stone-200",
    fallback: "bg-[#F4EEE6] text-[#8B5E3C] dark:bg-stone-800 dark:text-[#EADBC8]",
    activeBadge: "bg-[#FFFDFB] text-[#8B5E3C] border-amber-200/20",
    inactiveBadge: "bg-[#F4EEE6] text-stone-500 border-stone-200/40",
    editBtn: "text-stone-400 hover:text-[#8B5E3C]",
    deleteBtn: "text-stone-400 hover:text-[#8B5E3C]",
    threadBorder: "border-stone-200/60",
    imgBtn: "hover:bg-[#F4EEE6] hover:border-stone-300"
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
    deleteBtn: "text-stone-500 hover:text-[#EADBC8]",
    threadBorder: "border-stone-800/60",
    imgBtn: "hover:bg-stone-800 hover:border-stone-750"
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
    deleteBtn: "text-[#5C3D2E]/45 hover:text-[#5C3D2E]",
    threadBorder: "border-[#DEC4B0]/60",
    imgBtn: "hover:bg-[#EADBC8] hover:border-[#DEC4B0]"
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
    deleteBtn: "text-[#3B4D31]/45 hover:text-[#3B4D31]",
    threadBorder: "border-[#D2DAC3]/70",
    imgBtn: "hover:bg-[#DDE6D5] hover:border-[#C8D3BE]"
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
    deleteBtn: "text-[#4A3228]/45 hover:text-[#4A3228]",
    threadBorder: "border-[#DECAC0]/70",
    imgBtn: "hover:bg-[#E0D2C8] hover:border-[#D0BFAF]"
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
    deleteBtn: "text-[#632B30]/45 hover:text-[#632B30]",
    threadBorder: "border-[#F5D6D8]/70",
    imgBtn: "hover:bg-[#F9E2E5] hover:border-[#EDCCD2]"
  }
}

export const KLEIN_STICKERS = [
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
  { id: 'xinan', file: 'Kleinxinan.jpg', label: 'Ăn chực' },
]