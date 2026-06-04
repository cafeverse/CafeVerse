import React, { useState, useEffect, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '@/components/navbar'
import Titlebar from '@/components/titlebar'
import { cleanReleaseNotes } from '@/lib/utils'
import { AuthProvider } from '@/context/auth-context'

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/original'
const API_BASE_URL = 'https://cafeverce-api.vercel.app/'

export default function RootLayout(): React.JSX.Element {
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

  return (
    <AuthProvider>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-background font-sans text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
        <Titlebar />
        <Navbar updateAvailable={!!updateInfo} />
        <main className="flex-1 flex flex-col min-h-0 bg-background relative">
          <div className="flex-1 overflow-y-auto">
            <Outlet
              context={{
                getImageUrl,
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
    </AuthProvider>
  )
}
