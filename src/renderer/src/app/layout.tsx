import React, { useState, useEffect, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '@/components/navbar'
import Titlebar from '@/components/titlebar'
import { MediaItem } from '@/types'
import { cleanReleaseNotes } from '@/lib/utils'

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/original'
const API_BASE_URL = 'https://movies-api-silk-phi.vercel.app'

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
  // Watchlist State (Persisted locally in localStorage with error protection)
  const [watchlist, setWatchlist] = useState<MediaItem[]>(() => {
    try {
      const saved = localStorage.getItem('cafeverse_watchlist')
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      console.error('Failed to parse watchlist from localStorage:', e)
      return []
    }
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

  // Sync Watchlist with localStorage with error boundary protection
  useEffect(() => {
    try {
      localStorage.setItem('cafeverse_watchlist', JSON.stringify(watchlist))
    } catch (e) {
      console.error('Failed to save watchlist to localStorage:', e)
    }
  }, [watchlist])

  // Bind Auto Updater IPC Events with robust lifecycle and error timeout cleanup
  useEffect(() => {
    let errorTimeoutId: NodeJS.Timeout | null = null

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
      if (errorTimeoutId) clearTimeout(errorTimeoutId)
      errorTimeoutId = setTimeout(() => setUpdaterError(null), 5000)
    })

    return () => {
      unsubscribeAvailable()
      unsubscribeProgress()
      unsubscribeDownloaded()
      unsubscribeError()
      if (errorTimeoutId) {
        clearTimeout(errorTimeoutId)
      }
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
      <main className="flex-1 flex flex-col min-h-0 bg-background relative">
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
