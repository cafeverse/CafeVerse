import React, { useState, useEffect, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '@/components/navbar'
import { MediaItem } from '@/types'

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/original'
const API_BASE_URL = 'http://localhost:8080'

export interface AppContextType {
  watchlist: MediaItem[]
  setWatchlist: React.Dispatch<React.SetStateAction<MediaItem[]>>
  getImageUrl: (path?: string) => string
  getSlug: (title?: string) => string
  toggleWatchlist: (item: MediaItem) => void
  isItemInWatchlist: (item: MediaItem) => boolean
  API_BASE_URL: string
}

export default function RootLayout(): React.JSX.Element {
  // Watchlist State (Persisted locally in localStorage)
  const [watchlist, setWatchlist] = useState<MediaItem[]>(() => {
    const saved = localStorage.getItem('cafeverse_watchlist')
    return saved ? JSON.parse(saved) : []
  })

  // Format Helper for TMDB Images
  const getImageUrl = useCallback((path?: string): string => {
    if (!path) return ''
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    return `${TMDB_IMAGE_BASE}${cleanPath}`
  }, [])

  // Helper to generate a clean, URL-friendly slug from title or name
  const getSlug = useCallback((title?: string): string => {
    if (!title) return ''
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // remove special characters
      .replace(/\s+/g, '-') // replace spaces with hyphens
      .replace(/--+/g, '-') // replace multiple hyphens
      .trim()
  }, [])

  // Sync Watchlist with localStorage
  useEffect(() => {
    localStorage.setItem('cafeverse_watchlist', JSON.stringify(watchlist))
  }, [watchlist])

  // Watchlist Actions
  const toggleWatchlist = (item: MediaItem): void => {
    const exists = watchlist.some((w) => w.id === item.id && w.contentType === item.contentType)
    if (exists) {
      setWatchlist(
        watchlist.filter((w) => !(w.id === item.id && w.contentType === item.contentType))
      )
    } else {
      setWatchlist([...watchlist, item])
    }
  }

  const isItemInWatchlist = (item: MediaItem): boolean => {
    return watchlist.some((w) => w.id === item.id && w.contentType === item.contentType)
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background font-sans text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
      {/* 1. GLASSMORPHIC OBISIDAN SIDEBAR */}
      <Navbar watchlistCount={watchlist.length} />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-background relative">
        {/* Glow backdrop behind header */}
        <div className="absolute top-0 right-1/4 h-75 w-125 rounded-full bg-primary/5 blur-[120px]" />

        {/* CONTAINER CONTENT */}
        <div className="flex-1 p-8 overflow-y-auto">
          <Outlet
            context={{
              watchlist,
              setWatchlist,
              getImageUrl,
              getSlug,
              toggleWatchlist,
              isItemInWatchlist,
              API_BASE_URL
            }}
          />
        </div>
      </main>
    </div>
  )
}
