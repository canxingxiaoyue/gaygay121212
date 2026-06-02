'use client'

import { useEffect, useRef } from 'react'

export default function Comments() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const script = document.createElement('script')
    script.src = 'https://giscus.app/client.js'
    script.setAttribute('data-repo', 'canxingxiaoyue/gaygay121212')
    script.setAttribute('data-repo-id', 'R_kgDOSs5HkA')
    script.setAttribute('data-category', 'Announcements')
    script.setAttribute('data-category-id', 'DIC_kwDOSs5HkM4C-W1I')
    script.setAttribute('data-mapping', 'pathname')
    script.setAttribute('data-strict', '0')
    script.setAttribute('data-reactions-enabled', '1')
    script.setAttribute('data-emit-metadata', '0')
    script.setAttribute('data-input-position', 'top')
    script.setAttribute('data-theme', 'preferred_color_scheme')
    script.setAttribute('data-lang', 'vi')
    script.crossOrigin = 'anonymous'
    script.async = true

    ref.current.innerHTML = ''
    ref.current.appendChild(script)
  }, [])

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 border-t border-border mt-10">
      <h3 className="font-serif text-2xl font-bold mb-6">Bình luận góc quán</h3>
      <div ref={ref} className="giscus" />
    </div>
  )
}
