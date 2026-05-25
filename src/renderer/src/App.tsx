import React, { useState, useEffect, useCallback } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Flame, Film, Tv, Bookmark } from 'lucide-react'

// Import types
import { MediaItem } from '@/types'

// Import Navbar and Pages
import Navbar from '@/components/navbar'
import { Dashboard } from '@/pages/dashboard'
import { Movies } from '@/pages/movies'
import { TvShows } from '@/pages/tvshows'
import { Watchlist } from '@/pages/watchlist'
import { MovieDetail } from '@/pages/movieDetail'

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/original'
const API_BASE_URL = 'http://localhost:8080'

function App(): React.JSX.Element {
  const location = useLocation()

  // API Data States
  const [featuredItem, setFeaturedItem] = useState<MediaItem | null>(null)
  const [recentTrending, setRecentTrending] = useState<MediaItem[]>([])

  // Watchlist State (Persisted locally in localStorage)
  const [watchlist, setWatchlist] = useState<MediaItem[]>(() => {
    const saved = localStorage.getItem('cineverse_watchlist')
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
    localStorage.setItem('cineverse_watchlist', JSON.stringify(watchlist))
  }, [watchlist])

  // Fetch Featured Hero item & trending items when landing on dashboard
  useEffect(() => {
    const loadDashboardData = async (): Promise<void> => {
      try {
        const resMovies = await fetch(
          `${API_BASE_URL}/api/movies?limit=5&sort=popularity&order=desc`
        )
        if (resMovies.ok) {
          const moviesData = await resMovies.json()
          if (moviesData.data && moviesData.data.length > 0) {
            const mapped = moviesData.data.map((m: MediaItem) => ({
              ...m,
              slug: m.slug || getSlug(m.title || m.name)
            }))
            setFeaturedItem(mapped[0])
            setRecentTrending(mapped)
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard highlights:', err)
      }
    }
    loadDashboardData()
  }, [getSlug])

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

  // Dynamic header rendering based on active route path
  const renderHeaderTitle = (): React.ReactNode => {
    const path = location.pathname
    if (path === '/') {
      return (
        <>
          <Flame className="text-primary size-5" /> Dashboard
        </>
      )
    } else if (path === '/movies') {
      return (
        <>
          <Film className="text-primary size-5" /> Browse Movies
        </>
      )
    } else if (path === '/tvshows') {
      return (
        <>
          <Tv className="text-primary size-5" /> Browse TV Shows
        </>
      )
    } else if (path === '/watchlist') {
      return (
        <>
          <Bookmark className="text-primary size-5" /> My Curated Watchlist
        </>
      )
    }
    return 'Cineverse'
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background font-sans text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
      {/* 1. GLASSMORPHIC OBISIDAN SIDEBAR */}
      <Navbar watchlistCount={watchlist.length} />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-background relative">
        {/* Glow backdrop behind header */}
        <div className="absolute top-0 right-1/4 h-75 w-125 rounded-full bg-primary/5 blur-[120px]" />

        {/* TOP STATUS NAVIGATION BAR */}
        <header className="flex h-20 items-center justify-between px-8 border-b border-border/40 bg-background/20 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold uppercase tracking-wider text-foreground flex items-center gap-2.5">
              {renderHeaderTitle()}
            </h1>
          </div>
        </header>

        {/* CONTAINER CONTENT */}
        <div className="flex-1 p-8 overflow-y-auto">
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  featuredItem={featuredItem}
                  recentTrending={recentTrending}
                  getImageUrl={getImageUrl}
                  toggleWatchlist={toggleWatchlist}
                  isItemInWatchlist={isItemInWatchlist}
                  getSlug={getSlug}
                />
              }
            />
            <Route
              path="/movies"
              element={
                <Movies
                  API_BASE_URL={API_BASE_URL}
                  getImageUrl={getImageUrl}
                  isItemInWatchlist={isItemInWatchlist}
                  getSlug={getSlug}
                />
              }
            />
            <Route
              path="/movies/:slug"
              element={
                <MovieDetail
                  API_BASE_URL={API_BASE_URL}
                  getImageUrl={getImageUrl}
                  toggleWatchlist={toggleWatchlist}
                  isItemInWatchlist={isItemInWatchlist}
                  getSlug={getSlug}
                />
              }
            />
            <Route
              path="/tvshows"
              element={
                <TvShows
                  API_BASE_URL={API_BASE_URL}
                  getImageUrl={getImageUrl}
                  isItemInWatchlist={isItemInWatchlist}
                  getSlug={getSlug}
                />
              }
            />
            <Route
              path="/watchlist"
              element={
                <Watchlist
                  watchlist={watchlist}
                  setWatchlist={setWatchlist}
                  toggleWatchlist={toggleWatchlist}
                  getImageUrl={getImageUrl}
                  getSlug={getSlug}
                />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default App
