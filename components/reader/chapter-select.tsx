'use client'

import { useRouter } from 'next/navigation'

interface ChapterSelectProps {
  slug: string
  currentChapter: number
  chapters: { number: number; title: string }[]
}

export function ChapterSelect({ slug, currentChapter, chapters }: ChapterSelectProps) {
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    router.push(`/truyen/${slug}/${val}`)
  }

  return (
    <select
      value={currentChapter}
      onChange={handleChange}
      className="px-4 py-2 text-xs font-bold rounded-xl border border-[#E5D8C8] dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-1 focus:ring-[#8B5E3C] cursor-pointer max-w-[150px] md:max-w-[200px]"
    >
      {chapters.map((ch) => (
        <option key={ch.number} value={ch.number}>
          {ch.title}
        </option>
      ))}
    </select>
  )
}