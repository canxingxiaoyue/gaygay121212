'use client'
import { useEffect, useRef, useState } from 'react';

type CursorState = 'default' | 'link' | 'text';

export default function AnimatedCursor() {
  const cursorRef = useRef<HTMLImageElement>(null);
  const [cursorState, setCursorState] = useState<CursorState>('default');

  useEffect(() => {
    // Không chạy hiệu ứng này trên điện thoại/máy tính bảng (màn hình cảm ứng)
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const moveCursor = (e: MouseEvent) => {
      if (cursorRef.current) {
        // Cho ảnh GIF chạy theo tọa độ X, Y của chuột
        cursorRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }

      const target = e.target as HTMLElement;
      
      // 1. Kiểm tra xem có đang chỉ vào Văn bản không
      const isText = target.closest('p, span, h1, h2, h3, h4, h5, h6, input[type="text"], textarea, article');
      
      // 2. Kiểm tra xem có đang chỉ vào Link, Nút bấm, Menu không
      const isLink = target.closest('a, button, [role="button"], [role="option"], [role="menuitem"], [role="tab"], [role="combobox"], select, label');

      if (isLink) {
        setCursorState('link');
      } else if (isText) {
        setCursorState('text');
      } else {
        setCursorState('default');
      }
    };

    window.addEventListener('mousemove', moveCursor);
    return () => window.removeEventListener('mousemove', moveCursor);
  }, []);

  // Ẩn hoàn toàn component trên thiết bị di động
  if (typeof window !== 'undefined' && window.matchMedia("(pointer: coarse)").matches) {
    return null;
  }

  // Chọn đúng file GIF dựa vào trạng thái
  const getCursorSrc = () => {
    switch (cursorState) {
      case 'link': return '/cursors/link.gif';
      case 'text': return '/cursors/text.gif';
      default: return '/cursors/pointer.gif'; 
    }
  };

  return (
    <img
      ref={cursorRef}
      src={getCursorSrc()}
      alt="cursor"
      // w-8 h-8 là kích thước chuột, nếu to quá bạn có thể đổi thành w-6 h-6
      className="pointer-events-none fixed top-0 left-0 z-[99999] w-8 h-8 drop-shadow-md origin-top-left"
      style={{ 
        willChange: 'transform', 
        pointerEvents: 'none' // Thuộc tính này GIÚP CLICK XUYÊN QUA ẢNH, web không bị liệt
      }} 
    />
  );
}