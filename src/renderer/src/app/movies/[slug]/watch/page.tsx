import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, AlertTriangle, Clock, HardDrive, TrendingUp, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { MediaItem } from '@/types'
import MediaPlayer from '@/components/media-player'

const API_BASE = 'https://cafeverce-api.vercel.app'
const TMDB_ORIG = 'https://image.tmdb.org/t/p/original'

const getBackdrop = (item: MediaItem): string => {
  const path = item.backdropPath || item.posterPath
  if (!path) return ''
  const p = path.startsWith('/') ? path : `/${path}`
  return `${TMDB_ORIG}${p}`
}

const getPoster = (item: MediaItem): string => {
  const path = item.posterPath
  if (!path) return ''
  const p = path.startsWith('/') ? path : `/${path}`
  return `https://image.tmdb.org/t/p/w500${p}`
}

const resolveItem = (res: unknown): MediaItem | null => {
  if (res && typeof res === 'object') {
    const obj = res as Record<string, unknown>

    if (obj.id) return obj as unknown as MediaItem

    let itemObj: Record<string, unknown> | null = null
    if (obj.movie && typeof obj.movie === 'object') itemObj = obj.movie as Record<string, unknown>
    else if (obj.data && typeof obj.data === 'object') itemObj = obj.data as Record<string, unknown>
    else if (obj.item && typeof obj.item === 'object') itemObj = obj.item as Record<string, unknown>

    if (itemObj) {
      if (Array.isArray(obj.cast)) itemObj.cast = obj.cast
      if (Array.isArray(obj.genres)) {
        itemObj.genres = (obj.genres as Array<string | { name: string }>).map((g) =>
          typeof g === 'string' ? g : g.name
        )
      }
      return itemObj as unknown as MediaItem
    }
  }
  return null
}

const formatRuntime = (mins: number): string => {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}H ${m}M` : `${m}M`
}

export default function MovieWatchPage(): React.JSX.Element {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const [movie, setMovie] = useState<MediaItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [retryTrigger, setRetryTrigger] = useState(0)

  // Keep current time updated for finish time calculation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        navigate(`/movies/${slug}`)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate, slug])

  useEffect(() => {
    if (!slug) return
    let active = true

    const tryFetch = async (): Promise<void> => {
      if (active) {
        setLoading(true)
        setError(null)
        setMovie(null)
      }

      try {
        const res1 = await fetch(`${API_BASE}/movies/${slug}`)
        if (res1.ok) {
          const item = resolveItem(await res1.json())
          if (item && active) {
            setMovie(item)
            setLoading(false)
            return
          }
        }

        const res2 = await fetch(`${API_BASE}/movies/content/${slug}`)
        if (res2.ok) {
          const item = resolveItem(await res2.json())
          if (item && active) {
            setMovie(item)
            setLoading(false)
            return
          }
        }
        throw new Error('Movie not found')
      } catch {
        if (active) {
          setError(
            'We could not find this movie. It may have been removed or the link is incorrect.'
          )
          setLoading(false)
        }
      }
    }

    tryFetch()

    return () => {
      active = false
    }
  }, [slug, retryTrigger])

  if (loading) {
    return (
      <div className="min-h-full bg-background/95 animate-pulse flex flex-col items-center justify-center p-6 md:p-12 space-y-6">
        <div className="w-full max-w-7xl space-y-4">
          <Skeleton className="h-10 w-1/4 bg-white/5 rounded-xl" />
          <Skeleton className="w-full aspect-video rounded-3xl bg-white/5" />
          <Skeleton className="h-8 w-1/3 bg-white/5 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center gap-6 p-8 bg-background text-white">
        <AlertTriangle className="size-14 text-destructive/50" />
        <div className="text-center">
          <h2 className="text-lg font-black mb-2">Movie Not Found</h2>
          <p className="text-xs text-white/50 max-w-sm">{error}</p>
        </div>
        <div className="flex gap-4">
          <Button
            onClick={() => navigate(`/movies`)}
            className="bg-white text-black hover:bg-white/95 font-black rounded-xl px-5 flex items-center gap-2"
          >
            <ChevronLeft className="size-4" /> Back to Movies
          </Button>
          <Button
            onClick={() => setRetryTrigger((prev) => prev + 1)}
            className="bg-white/10 hover:bg-white/15 text-white border border-white/15 font-black rounded-xl px-5"
          >
            Retry Connection
          </Button>
        </div>
      </div>
    )
  }

  const backdrop = getBackdrop(movie)
  const poster = getPoster(movie)
  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null

  // ─── Interesting Calculations ───────────────────────────────────────────────

  // 1. Estimated Watch Finish Time (Netflix / Plex style)
  const getFinishTimeLabel = (runtimeMinutes: number): string => {
    const finish = new Date(currentTime.getTime() + runtimeMinutes * 60 * 1000)
    return finish.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }

  // 2. Estimated stream size (at standard bitrates)
  // ~1 GB per hour for typical 1080p H.264 video
  const estimateStreamSize = (runtimeMinutes: number): string => {
    const sizeGb = (runtimeMinutes / 60) * 1
    return `${sizeGb.toFixed(2)} GB`
  }

  // 3. ROI (Return on Investment) calculation if budget & revenue are available
  const getROI = (budget?: number, revenue?: number): { roi: string; profit: string } | null => {
    if (!budget || !revenue || budget <= 0) return null
    const profit = revenue - budget
    const roiPercent = (profit / budget) * 100
    const formatCurrency = (val: number): string => {
      if (val >= 1.0e9) return `$${(val / 1.0e9).toFixed(2)}B`
      if (val >= 1.0e6) return `$${(val / 1.0e6).toFixed(1)}M`
      return `$${val.toLocaleString()}`
    }
    return {
      roi: `${roiPercent >= 0 ? '+' : ''}${roiPercent.toFixed(0)}%`,
      profit: formatCurrency(profit)
    }
  }

  const roiInfo = getROI(movie.budget, movie.revenue)

  return (
    <div className="min-h-full bg-background text-white font-sans antialiased relative pb-20">
      {/* Immersive backdrop blur overlay */}
      {backdrop && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15 blur-3xl pointer-events-none select-none"
          style={{ backgroundImage: `url(${backdrop})` }}
        />
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-6 space-y-8">
        {/* Navigation Row */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => navigate(`/movies/${slug}`)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black/40 border border-white/10 hover:bg-black/60 text-white/85 hover:text-white text-[11px] font-bold tracking-widest uppercase cursor-pointer backdrop-blur-md transition-all"
          >
            <ChevronLeft className="size-4" />
            <span>Back to Details</span>
          </button>
        </div>

        {/* Media Player Component */}
        <div className="w-full aspect-video overflow-hidden border border-white/5 bg-black">
          <MediaPlayer item={movie} />
        </div>

        {/* Movie Info & Insights Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4">
          {/* Col 1: Poster & Meta (3 cols) */}
          <div className="md:col-span-3 space-y-4">
            {poster ? (
              <img
                src={poster}
                alt={movie.title || movie.name}
                className="w-full rounded-2xl border border-white/5 object-cover aspect-2/3"
              />
            ) : (
              <div className="w-full rounded-2xl border border-white/5 bg-white/5 aspect-2/3 flex items-center justify-center">
                <span className="text-xs text-white/35 font-bold uppercase tracking-widest">
                  No Poster
                </span>
              </div>
            )}
            <div className="space-y-3 pt-2">
              {movie.originalTitle && movie.originalTitle !== movie.title && (
                <div>
                  <span className="text-[10px] text-white/45 font-bold tracking-[0.2em] uppercase block">
                    Original Title
                  </span>
                  <span className="text-xs font-semibold text-white/80 block mt-0.5 leading-tight">
                    {movie.originalTitle}
                  </span>
                </div>
              )}
              {movie.runtime && (
                <div>
                  <span className="text-[10px] text-white/45 font-bold tracking-[0.2em] uppercase block">
                    Duration
                  </span>
                  <span className="text-xs font-semibold text-white/80 block mt-0.5">
                    {formatRuntime(movie.runtime)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Col 2: Title, Tagline, Storyline (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
                {movie.title || movie.name}
              </h1>
              <div className="flex flex-wrap items-center gap-1.5">
                {year && (
                  <span className="text-[10px] font-extrabold tracking-widest text-white/50 uppercase mr-1">
                    {year}
                  </span>
                )}
                {movie.genres?.map((g) => (
                  <span
                    key={g}
                    className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[8.5px] font-black text-white/60 uppercase tracking-wider"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>

            {movie.tagline && (
              <p className="text-xs text-primary italic font-bold tracking-wide">
                &ldquo;{movie.tagline}&rdquo;
              </p>
            )}

            <div className="space-y-2">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
                Storyline Summary
              </h2>
              <p className="text-sm text-white/70 leading-relaxed font-medium">
                {movie.overview || 'No synopsis is available for this title.'}
              </p>
            </div>
          </div>

          {/* Col 3: Insights & Calculations (4 cols) */}
          <div className="md:col-span-4 space-y-4">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
              Dynamic Insights
            </h2>

            <div className="space-y-3">
              {movie.runtime && (
                <>
                  {/* Finish time */}
                  <div className="bg-[#2e2e2e]/30 border border-white/5 p-4 flex items-start gap-3">
                    <Clock className="size-4 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">
                        Finish Watching At
                      </span>
                      <span className="text-sm font-black text-white">
                        {getFinishTimeLabel(movie.runtime)}
                      </span>
                    </div>
                  </div>

                  {/* Stream Size */}
                  <div className="bg-[#2e2e2e]/30 border border-white/5 p-4 flex items-start gap-3">
                    <HardDrive className="size-4 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">
                        Est. Stream Size
                      </span>
                      <span className="text-sm font-black text-white">
                        {estimateStreamSize(movie.runtime)}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Popularity */}
              <div className="bg-[#2e2e2e]/30 border border-white/5 p-4 flex items-start gap-3">
                <TrendingUp className="size-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">
                    Popularity Index
                  </span>
                  <span className="text-sm font-black text-white">
                    {movie.popularity ? Math.round(movie.popularity).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>

              {/* ROI */}
              {roiInfo ? (
                <div className="bg-[#2e2e2e]/30 border border-white/5 p-4 flex items-start gap-3">
                  <DollarSign className="size-4 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">
                      Net Profit (ROI)
                    </span>
                    <span className="text-sm font-black text-white">
                      {roiInfo.profit}{' '}
                      <span className="text-[11px] font-bold text-green-400">({roiInfo.roi})</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-[#2e2e2e]/30 border border-white/5 p-4 flex items-start gap-3">
                  <DollarSign className="size-4 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest block">
                      Box Office Return
                    </span>
                    <span className="text-sm font-black text-white">Unavailable</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
