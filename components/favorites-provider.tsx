'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

export type Comment = {
  id: string
  storySlug: string
  user: string
  rating: number
  text: string
  date: string
}

export type ReadingProgress = {
  storySlug: string
  chapter: number
  updatedAt: number
}

type User = { name: string; email: string } | null

type AppContextType = {
  // favorites
  favorites: string[]
  toggleFavorite: (slug: string) => void
  isFavorite: (slug: string) => boolean
  // reading history
  history: ReadingProgress[]
  recordReading: (slug: string, chapter: number) => void
  getProgress: (slug: string) => ReadingProgress | undefined
  // comments
  comments: Comment[]
  addComment: (c: Omit<Comment, 'id' | 'date'>) => void
  // auth (demo)
  user: User
  login: (name: string, email: string) => void
  logout: () => void
  hydrated: boolean
}

const AppContext = createContext<AppContextType | null>(null)

const FAV_KEY = 'qt_favorites'
const HIST_KEY = 'qt_history'
const CMT_KEY = 'qt_comments'
const USER_KEY = 'qt_user'

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([])
  const [history, setHistory] = useState<ReadingProgress[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [user, setUser] = useState<User>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setFavorites(load<string[]>(FAV_KEY, []))
    setHistory(load<ReadingProgress[]>(HIST_KEY, []))
    setComments(load<Comment[]>(CMT_KEY, []))
    setUser(load<User>(USER_KEY, null))
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(FAV_KEY, JSON.stringify(favorites))
  }, [favorites, hydrated])
  useEffect(() => {
    if (hydrated) window.localStorage.setItem(HIST_KEY, JSON.stringify(history))
  }, [history, hydrated])
  useEffect(() => {
    if (hydrated) window.localStorage.setItem(CMT_KEY, JSON.stringify(comments))
  }, [comments, hydrated])
  useEffect(() => {
    if (hydrated) window.localStorage.setItem(USER_KEY, JSON.stringify(user))
  }, [user, hydrated])

  const toggleFavorite = (slug: string) =>
    setFavorites((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    )
  const isFavorite = (slug: string) => favorites.includes(slug)

  const recordReading = (slug: string, chapter: number) =>
    setHistory((prev) => {
      const others = prev.filter((p) => p.storySlug !== slug)
      return [
        { storySlug: slug, chapter, updatedAt: Date.now() },
        ...others,
      ].slice(0, 50)
    })
  const getProgress = (slug: string) =>
    history.find((p) => p.storySlug === slug)

  const addComment = (c: Omit<Comment, 'id' | 'date'>) =>
    setComments((prev) => [
      {
        ...c,
        id: Math.random().toString(36).slice(2),
        date: new Date().toLocaleDateString('vi-VN'),
      },
      ...prev,
    ])

  const login = (name: string, email: string) => setUser({ name, email })
  const logout = () => setUser(null)

  return (
    <AppContext.Provider
      value={{
        favorites,
        toggleFavorite,
        isFavorite,
        history,
        recordReading,
        getProgress,
        comments,
        addComment,
        user,
        login,
        logout,
        hydrated,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within FavoritesProvider')
  return ctx
}
