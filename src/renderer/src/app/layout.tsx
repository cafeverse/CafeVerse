import React, { useState, useEffect, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '@/components/navbar'
import Titlebar from '@/components/titlebar'
import { MediaItem } from '@/types'

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/original'
const API_BASE_URL = 'https://api.movies.voidart.us'

const cleanReleaseNotes = (rawNotes?: string): string => {
  if (!rawNotes) return ''

  let cleaned = rawNotes

  // 1. Remove the center-aligned badge paragraph (e.g., <p align="center">...</p>)
  cleaned = cleaned.replace(/<p\s+align="center">[\s\S]*?<\/p>/gi, '')

  // 2. Remove redundant <h2> or <h1> release note titles (e.g. <h2>🚀 Release Notes...</h2>)
  cleaned = cleaned.replace(/<h2[^>]*>[\s\S]*?<\/h2>/gi, '')

  // 3. Remove HR dividers and automated build footers
  cleaned = cleaned.replace(/<hr\s*\/?>/gi, '')
  cleaned = cleaned.replace(/<p>\s*<em>[\s\S]*?<\/em>\s*<\/p>/gi, '')

  return cleaned.trim()
}

export interface AppContextType {
  watchlist: MediaItem[]
  setWatchlist: React.Dispatch<React.SetStateAction<MediaItem[]>>
  getImageUrl: (path?: string) => string
  getSlug: (title?: string) => string
  toggleWatchlist: (item: MediaItem) => void
  isItemInWatchlist: (item: MediaItem) => boolean
  API_BASE_URL: string
  updateInfo: { version: string; releaseNotes?: string } | null
  downloading: boolean
  downloadProgress: number
  downloaded: boolean
  updaterError: string | null
  currentVersion: string
  cleanReleaseNotes: (rawNotes?: string) => string
}

export default function RootLayout(): React.JSX.Element {
  // Watchlist State (Persisted locally in localStorage)
  const [watchlist, setWatchlist] = useState<MediaItem[]>(() => {
    const saved = localStorage.getItem('cafeverse_watchlist')
    return saved ? JSON.parse(saved) : []
  })

  // Auto Updater State
  const [updateInfo, setUpdateInfo] = useState<{ version: string; releaseNotes?: string } | null>(
    null
  )
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [downloaded, setDownloaded] = useState(false)
  const [updaterError, setUpdaterError] = useState<string | null>(null)
  const [currentVersion, setCurrentVersion] = useState('')

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

  // Bind Auto Updater IPC Events
  useEffect(() => {
    if (window.api?.getAppVersion) {
      window.api.getAppVersion().then((ver) => setCurrentVersion(ver))
    }

    if (!window.api?.autoUpdater) return

    const unsubscribeAvailable = window.api.autoUpdater.onUpdateAvailable((info) => {
      setUpdateInfo(info as { version: string; releaseNotes?: string })
      setUpdaterError(null)
    })

    const unsubscribeProgress = window.api.autoUpdater.onDownloadProgress((progress) => {
      setDownloading(true)
      setDownloadProgress(Math.round((progress as { percent?: number }).percent || 0))
    })

    const unsubscribeDownloaded = window.api.autoUpdater.onUpdateDownloaded(() => {
      setDownloading(false)
      setDownloaded(true)
    })

    const unsubscribeError = window.api.autoUpdater.onError((err) => {
      setUpdaterError(typeof err === 'string' ? err : 'Update failed')
      setDownloading(false)
      setTimeout(() => setUpdaterError(null), 5000)
    })

    return () => {
      unsubscribeAvailable()
      unsubscribeProgress()
      unsubscribeDownloaded()
      unsubscribeError()
    }
  }, [])

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
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background font-sans text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
      <Titlebar />
      <Navbar watchlistCount={watchlist.length} updateAvailable={!!updateInfo} />
      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-background relative">
        <div className="absolute top-0 right-1/4 h-75 w-125 rounded-full bg-primary/5 blur-[120px]" />
        <div className="flex-1 overflow-y-auto">
          <Outlet
            context={{
              watchlist,
              setWatchlist,
              getImageUrl,
              getSlug,
              toggleWatchlist,
              isItemInWatchlist,
              API_BASE_URL,
              updateInfo,
              downloading,
              downloadProgress,
              downloaded,
              updaterError,
              currentVersion,
              cleanReleaseNotes
            }}
          />
        </div>
      </main>
    </div>
  )
}
