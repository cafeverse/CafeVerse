import React, { useState } from 'react'
import { NavLink, useOutletContext } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUpCircle,
  CheckCircle2,
  Download,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import type { AppContextType } from '@/types'

export default function UpdatePage(): React.JSX.Element {
  const {
    updateInfo,
    downloading,
    downloadProgress,
    downloaded,
    updaterError,
    currentVersion,
    cleanReleaseNotes
  } = useOutletContext<AppContextType>()

  const [checking, setChecking] = useState(false)
  const [checkStatus, setCheckStatus] = useState<string | null>(null)

  const handleManualCheck = async (): Promise<void> => {
    if (!window.api?.autoUpdater) return
    setChecking(true)
    setCheckStatus(null)
    try {
      await window.api.autoUpdater.checkForUpdates()
      // Wait a moment for visual feedback
      setTimeout(() => {
        setChecking(false)
        setCheckStatus('No updates found. You are running the latest version.')
        setTimeout(() => setCheckStatus(null), 4000)
      }, 1500)
    } catch {
      setChecking(false)
      setCheckStatus('Failed to query update server.')
      setTimeout(() => setCheckStatus(null), 4000)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full flex items-center justify-center p-6 sm:p-12 relative overflow-hidden select-none">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-destructive/5 blur-[120px] pointer-events-none" />

      {/* Premium Obsidian Card Container */}
      <div className="w-full max-w-2xl bg-[#0c0a09]/60 backdrop-blur-2xl border border-white/[0.06] rounded-3xl p-6 sm:p-10 relative shadow-[0_25px_60px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in duration-300">
        {/* Subtle top highlights */}
        <div className="absolute top-0 left-10 right-10 h-[1px] bg-linear-to-r from-transparent via-primary/30 to-transparent pointer-events-none" />

        {/* Navigation / Back Button */}
        <div className="mb-8 flex items-center justify-between">
          <NavLink
            to="/"
            className="flex items-center gap-2 text-xs font-bold text-muted-foreground/60 hover:text-white transition-colors group cursor-pointer"
          >
            <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </NavLink>
          <span className="text-[10px] font-black text-white/20 tracking-[0.25em] uppercase">
            System Route
          </span>
        </div>

        {updateInfo ? (
          /* ACTIVE UPDATE FLOW */
          <div className="flex flex-col gap-6">
            {/* Header section with Upgrade Path */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.04] pb-6">
              <div className="flex items-center gap-4">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-[#1c1917] to-[#0c0a09] border border-white/[0.06] shadow-inner">
                  <ArrowUpCircle className="size-6 text-primary animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-primary/75 tracking-[0.3em] uppercase leading-none mb-1.5">
                    System Update Pending
                  </span>
                  <h2 className="text-xl font-black text-white tracking-tight leading-tight">
                    CaféVerse v{updateInfo.version}
                  </h2>
                </div>
              </div>

              {/* Version Upgrade Badge */}
              <div className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.04] rounded-2xl px-4 py-2 shrink-0 self-start sm:self-auto font-mono text-xs font-semibold">
                <span className="text-muted-foreground/40">
                  {currentVersion ? `v${currentVersion}` : 'v0.0.0'}
                </span>
                <span className="text-primary/60">→</span>
                <span className="text-white">v{updateInfo.version}</span>
              </div>
            </div>

            {/* Release Notes */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-black text-white/50 tracking-[0.15em] uppercase">
                What&apos;s New in this Version
              </h3>
              {updateInfo.releaseNotes ? (
                <div
                  className="text-sm text-muted-foreground/80 leading-relaxed bg-white/[0.01] border border-white/[0.03] rounded-2xl p-5 max-h-[300px] overflow-y-auto scrollbar-thin font-medium [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-2 [&_li]:first:mt-0 [&_h3]:font-black [&_h3]:text-white [&_h3]:uppercase [&_h3]:tracking-wider [&_h3]:text-xs [&_h3]:mt-5 [&_h3]:first:mt-0 [&_p]:mb-3 [&_p]:last:mb-0"
                  dangerouslySetInnerHTML={{ __html: cleanReleaseNotes(updateInfo.releaseNotes) }}
                />
              ) : (
                <div className="text-sm text-muted-foreground/80 leading-relaxed bg-white/[0.01] border border-white/[0.03] rounded-2xl p-5 font-medium">
                  This version includes exciting performance enhancements, library fixes, and visual
                  UI optimizations to elevate your streaming experience.
                </div>
              )}
            </div>

            {/* Error Message */}
            {updaterError && (
              <div className="flex items-center gap-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-2xl p-4 font-semibold">
                <AlertCircle className="size-5 shrink-0" />
                <span>Error checking or downloading update: {updaterError}</span>
              </div>
            )}

            {/* Downloading State & Progress Bar */}
            {downloading && (
              <div className="flex flex-col gap-3 bg-white/[0.01] border border-white/[0.02] rounded-2xl p-5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-primary animate-pulse flex items-center gap-2">
                    <RefreshCw className="size-3.5 animate-spin" />
                    Downloading installation package...
                  </span>
                  <span className="text-white/80">{downloadProgress}%</span>
                </div>
                <Progress value={downloadProgress} className="h-2 bg-white/5" />
              </div>
            )}

            {/* Footer Control Buttons */}
            <div className="mt-4 pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-end gap-3">
              <NavLink
                to="/"
                className="w-full sm:w-auto h-11 px-6 rounded-xl flex items-center justify-center text-xs font-black uppercase tracking-wider text-muted-foreground hover:text-white bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all cursor-pointer"
              >
                Skip For Now
              </NavLink>

              {!downloaded ? (
                <button
                  disabled={downloading}
                  onClick={() => window.api?.autoUpdater?.downloadUpdate()}
                  className={`w-full sm:w-auto h-11 px-8 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-lg select-none border border-transparent ${
                    downloading
                      ? 'bg-white/5 text-muted-foreground/40 cursor-not-allowed border-white/[0.02]'
                      : 'bg-primary text-primary-foreground hover:bg-primary/95 hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {downloading ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="size-4" />
                      Download & Update Now
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => window.api?.autoUpdater?.quitAndInstall()}
                  className="w-full sm:w-auto h-11 px-8 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer shadow-lg select-none border border-transparent shadow-emerald-500/25"
                >
                  <RefreshCw className="size-4 animate-spin-slow" />
                  Restart & Apply Update
                </button>
              )}
            </div>
          </div>
        ) : (
          /* SYSTEM UP-TO-DATE FALLBACK STATE */
          <div className="flex flex-col items-center text-center py-6 gap-6">
            {/* Green glowing check icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/10 blur-xl rounded-full scale-150" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-linear-to-br from-[#1c1917] to-[#0c0a09] border border-white/[0.06] shadow-xl text-emerald-500 animate-in zoom-in-50 duration-500">
                <CheckCircle2 className="size-10" />
              </div>
            </div>

            <div className="flex flex-col gap-2 max-w-md">
              <h2 className="text-xl font-black text-white tracking-tight leading-tight uppercase italic">
                System Up To Date
              </h2>
              <p className="text-sm text-muted-foreground/75 leading-relaxed font-medium">
                You are currently running the latest release version of CaféVerse. There are no
                pending updates.
              </p>
            </div>

            {/* Version tag */}
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl px-4 py-2 font-mono text-xs font-semibold text-muted-foreground">
              Current Version:{' '}
              <span className="text-white">{currentVersion ? `v${currentVersion}` : 'v0.0.0'}</span>
            </div>

            {checkStatus && (
              <div className="text-xs text-primary/80 bg-primary/5 border border-primary/10 rounded-xl px-4 py-2.5 font-semibold animate-in fade-in duration-300">
                {checkStatus}
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 border-t border-white/[0.04] w-full pt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                disabled={checking}
                onClick={handleManualCheck}
                className="w-full sm:w-auto h-11 px-6 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground hover:text-white bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`size-3.5 ${checking ? 'animate-spin' : ''}`} />
                {checking ? 'Checking Server...' : 'Check For Updates'}
              </button>

              <NavLink
                to="/"
                className="w-full sm:w-auto h-11 px-8 rounded-xl flex items-center justify-center text-xs font-black uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/95 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer shadow-lg"
              >
                Go to Dashboard
              </NavLink>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
