'use client'
import { useEffect, useRef } from 'react';

export default function AnimatedCursor() {
  const cursorRef = useRef<HTMLImageElement>(null);
  
  // Dùng biến thông thường thay vì State để tránh lag Web khi di chuột
  const currentHoverType = useRef<string>('default');

  useEffect(() => {
    // Tắt trên điện thoại / máy tính bảng
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const moveCursor = (e: MouseEvent) => {
      if (!cursorRef.current) return;

      // 1. Cho ảnh đi theo chuột (Dùng translate3d để mượt nhất bằng phần cứng)
      cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;

      // 2. Xác định xem chuột đang chỉ vào cái gì
      const target = e.target as HTMLElement;
      
      // Tập hợp các thẻ là Link, Nút bấm, Menu lựa chọn
      const isLink = target.closest('a, button, [role="button"], [role="option"], [role="menuitem"], [role="tab"], [role="combobox"], select, label, .cursor-pointer');
      
      // Tập hợp các thẻ chứa Chữ (Thêm article, div.prose thường dùng trong web truyện)
      const isText = target.closest('p, span, h1, h2, h3, h4, h5, h6, input[type="text"], textarea, article, blockquote');

      // 3. Quyết định xem nên hiện ảnh nào
      let nextState = 'default';
      if (isLink) {
        nextState = 'link';
      } else if (isText) {
        nextState = 'text';
      }

      // 4. CHỈ ĐỔI ẢNH KHI TRẠNG THÁI THAY ĐỔI (Tránh bị chớp giật hình)
      if (currentHoverType.current !== nextState) {
        currentHoverType.current = nextState;
        
        // Nhớ đảm bảo tên file trong thư mục public/cursors phải viết CHỮ THƯỜNG giống hệt thế này
        if (nextState === 'link') {
          cursorRef.current.src = '/cursors/link.gif';
        } else if (nextState === 'text') {
          cursorRef.current.src = '/cursors/text.gif';
        } else {
          cursorRef.current.src = '/cursors/pointer.gif';
        }
      }
    };

    window.addEventListener('mousemove', moveCursor);
    return () => window.removeEventListener('mousemove', moveCursor);
  }, []);

  if (typeof window !== 'undefined' && window.matchMedia("(pointer: coarse)").matches) {
    return null;
  }

  return (
    <img
      ref={cursorRef}
      src="/cursors/pointer.gif"
      alt=""
      // z-[999999] để đảm bảo con chuột luôn đè lên mọi thứ khác
      className="pointer-events-none fixed top-0 left-0 z-[999999] w-8 h-8 drop-shadow-md origin-top-left"
      style={{ 
        willChange: 'transform' // Báo cho trình duyệt biết phần này sẽ di chuyển liên tục để tối ưu
      }} 
    />
  );
}