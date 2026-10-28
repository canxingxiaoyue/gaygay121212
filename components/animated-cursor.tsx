'use client'
import { useEffect, useRef } from 'react';

export default function AnimatedCursor() {
  const cursorRef = useRef<HTMLImageElement>(null);
  const currentHoverType = useRef<string>('default');
  const isClicking = useRef<boolean>(false);

  useEffect(() => {
    // Tắt trên điện thoại / cảm ứng
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const updateCursor = (e: MouseEvent) => {
      if (!cursorRef.current) return;

      // 1. Di chuyển theo chuột
      cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;

      // 2. Nếu đang giữ chuột (Click), giữ nguyên biểu cảm bắn tim ❤️
      if (isClicking.current) return;

      // Dùng elementFromPoint để bắt chính xác thẻ đang nằm dưới chuột
      const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      if (!target) return;

      // Phân loại các khu vực trên web:
      // A. Khu vực Menu cài đặt, Font chữ, Đổi Theme ("Góc đọc của mèo")
      const isSettings = target.closest('[role="combobox"], [role="option"], [role="menuitem"], select, input[type="range"], .theme-selector');

      // B. Khu vực Nút bấm, Link, Nút chọn chương
      const isLink = target.closest('a, button, [role="button"], [role="tab"], label, .cursor-pointer');

      // C. Khu vực Chữ đọc truyện
      const isText = target.closest('p, span, h1, h2, h3, h4, article, blockquote');

      let nextState = 'default';
      if (isSettings) {
        nextState = 'help';
      } else if (isLink) {
        nextState = 'link';
      } else if (isText) {
        nextState = 'text';
      }

      // 3. Chỉ đổi ảnh khi trạng thái thay đổi rõ rệt
      if (currentHoverType.current !== nextState) {
        currentHoverType.current = nextState;
        
        switch (nextState) {
          case 'help':
            cursorRef.current.src = '/cursors/help.gif'; // Hiện dấu hỏi ❓
            break;
          case 'link':
            cursorRef.current.src = '/cursors/link.gif'; // Chỉ tay
            break;
          case 'text':
            cursorRef.current.src = '/cursors/1.gif'; // Bong bóng chat suy nghĩ 💬
            break;
          default:
            cursorRef.current.src = '/cursors/pointer.gif'; // Lắc lư bình thường
            break;
        }
      }
    };

    // Khi người dùng BẤM CHUỘT XUỐNG -> Bắn tim ngay lập tức!
    const handleMouseDown = () => {
      isClicking.current = true;
      if (cursorRef.current) {
        currentHoverType.current = 'click';
        cursorRef.current.src = '/cursors/2.gif'; // Bé bắn tim ❤️
      }
    };

    // Khi người dùng THẢ CHUỘT RA -> Quay lại trạng thái bình thường
    const handleMouseUp = (e: MouseEvent) => {
      isClicking.current = false;
      updateCursor(e);
    };

    window.addEventListener('mousemove', updateCursor);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', updateCursor);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  if (typeof window !== 'undefined' && window.matchMedia("(pointer: coarse)").matches) {
    return null;
  }

  return (
    <img
      ref={cursorRef}
      src="/cursors/pointer.gif"
      alt=""
      // w-10 h-10 (40px) giúp nhìn rõ icon tim và dấu chấm hỏi
      className="fixed top-0 left-0 z-[999999] w-10 h-10 drop-shadow-md origin-top-left"
      style={{ 
        willChange: 'transform',
        pointerEvents: 'none' // Bắt buộc để click xuyên qua ảnh
      }} 
    />
  );
}