"use client"
import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react"

const STORAGE_KEY = "wbse:favorites"

interface FavoritesContextValue {
  favorites: number[]
  isFavorite: (id: number) => boolean
  toggle: (id: number) => void
  count: number
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<number[]>([])
  const [loaded, setLoaded] = useState(false)

  // Hydrate from localStorage once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setFavorites(JSON.parse(raw))
    } catch {
      /* ignore malformed storage */
    }
    setLoaded(true)
  }, [])

  // Persist whenever favorites change (after the initial hydrate)
  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
    } catch {
      /* storage may be unavailable (private mode) */
    }
  }, [favorites, loaded])

  const toggle = useCallback((id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }, [])

  const isFavorite = useCallback((id: number) => favorites.includes(id), [favorites])

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggle, count: favorites.length }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error("useFavorites must be used within a FavoritesProvider")
  return ctx
}
