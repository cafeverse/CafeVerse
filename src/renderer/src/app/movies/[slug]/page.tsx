import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { ChevronLeft, Star, Play, Check, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { MediaItem } from '@/types'

// ─── Constants ───────────────────────────────────────────────────────────────

const API_BASE = 'https://cafeverce-api.vercel.app'
const TMDB_ORIG = 'https://image.tmdb.org/t/p/original'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getBackdrop = (item: MediaItem): string => {
  const path = item.backdropPath || item.posterPath
  if (!path) return ''
  const p = path.startsWith('/') ? path : `/${path}`
  return `${TMDB_ORIG}${p}`
}

const resolveItem = (res: unknown): MediaItem | null => {
  if (res && typeof res === 'object') {
    const obj = res as Record<string, unknown>

    // Some endpoints return the item directly
    if (obj.id) return obj as unknown as MediaItem

    // Others wrap it in a data, item, or movie property
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MovieSlugPage(): React.JSX.Element {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  useOutletContext<{ getImageUrl: (path?: string) => string }>()

  const [movie, setMovie] = useState<MediaItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Watchlist ─────────────────────────────────────────────────────────────
  const [watchlist, setWatchlist] = useState<MediaItem[]>(() => {
    try {
      const s = localStorage.getItem('cafeverse_watchlist')
      return s ? JSON.parse(s) : []
    } catch {
      return []
    }
  })

  const inWatchlist = movie
    ? watchlist.some((w) => w.id === movie.id && w.contentType === movie.contentType)
    : false

  const toggleWatchlist = useCallback(() => {
    if (!movie) return
    setWatchlist((prev) => {
      const exists = prev.some((w) => w.id === movie.id && w.contentType === movie.contentType)
      const updated = exists
        ? prev.filter((w) => !(w.id === movie.id && w.contentType === movie.contentType))
        : [...prev, movie]
      localStorage.setItem('cafeverse_watchlist', JSON.stringify(updated))
      return updated
    })
  }, [movie])

  // ── Fetch movie ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!slug) return
    const timer = setTimeout(() => {
      setLoading(true)
      setError(null)
      setMovie(null)

      const tryFetch = async (): Promise<void> => {
        const res1 = await fetch(`${API_BASE}/movies/${slug}`)
        if (res1.ok) {
          const item = resolveItem(await res1.json())
          if (item) {
            setMovie(item)
            return
          }
        }

        const res2 = await fetch(`${API_BASE}/movies/content/${slug}`)
        if (res2.ok) {
          const item = resolveItem(await res2.json())
          if (item) {
            setMovie(item)
            return
          }
        }
        throw new Error('Movie not found')
      }

      tryFetch()
        .catch(() =>
          setError(
            'We could not find this movie. It may have been removed or the link is incorrect.'
          )
        )
        .finally(() => setLoading(false))
    }, 0)

    return () => clearTimeout(timer)
  }, [slug])

  const handlePlayClick = (): void => {
    navigate(`/movies/${slug}/watch`)
  }

  if (loading) {
    return (
      <div className="min-h-full bg-[#09090b] animate-pulse">
        <Skeleton className="w-full h-[65vh] rounded-none bg-white/5" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 space-y-6">
          <Skeleton className="h-8 w-1/3 bg-white/5" />
          <Skeleton className="h-4 w-1/4 bg-white/5" />
          <Skeleton className="h-24 w-full max-w-3xl bg-white/5" />
        </div>
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center gap-6 p-8 bg-[#09090b] text-white">
        <AlertTriangle className="size-14 text-red-500/50" />
        <div className="text-center">
          <h2 className="text-lg font-black mb-2">Movie Not Found</h2>
          <p className="text-xs text-white/50 max-w-sm">{error}</p>
        </div>
        <Button
          onClick={() => navigate('/movies')}
          className="bg-white text-black font-black rounded-xl px-5 flex items-center gap-2"
        >
          <ChevronLeft className="size-4" /> Back to Movies
        </Button>
      </div>
    )
  }

  const backdrop = getBackdrop(movie)
  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null
  const runtime = movie.runtime ? formatRuntime(movie.runtime) : null
  const primaryGenre = movie.genres?.[0]?.toUpperCase()

  return (
    <div className="min-h-full bg-[#09090b] text-white font-sans antialiased selection:bg-white/20">
      {/* ── 1. Hero Backdrop ─────────────────────────────────────────────── */}
      <div className="relative w-full h-[65vh] min-h-112.5 overflow-hidden">
        {backdrop ? (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-100"
            style={{ backgroundImage: `url(${backdrop})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-white/5" />
        )}

        {/* Soft radial vignette & bottom gradient to blend into background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(9,9,11,0.4)_100%)]" />
        <div className="absolute inset-0 bg-linear-to-t from-[#09090b] via-[#09090b]/50 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-r from-[#09090b]/80 via-transparent to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate('/movies')}
          className="absolute top-6 left-6 md:left-12 z-20 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black/40 border border-white/10 hover:bg-black/60 text-white/80 hover:text-white text-[11px] font-bold tracking-widest uppercase cursor-pointer backdrop-blur-md transition-all"
        >
          <ChevronLeft className="size-4" />
          <span>Back</span>
        </button>

        {/* Title & Meta */}
        <div className="absolute bottom-10 left-6 md:left-12 lg:left-24 z-10 max-w-4xl">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.9] drop-shadow-2xl">
            {movie.title || movie.name}
          </h1>

          <div className="flex items-center gap-3 md:gap-4 mt-6 text-[11px] md:text-xs font-bold tracking-widest text-white/80 drop-shadow-md uppercase">
            {year && <span>{year}</span>}
            {year && runtime && <span className="text-white/40">•</span>}
            {runtime && <span>{runtime}</span>}
            {runtime && primaryGenre && <span className="text-white/40">•</span>}
            {primaryGenre && <span>{primaryGenre}</span>}
          </div>
        </div>
      </div>

      {/* ── 2. Main Content ──────────────────────────────────────────────── */}
      <div className="max-w-350 mx-auto px-6 md:px-12 lg:px-24 py-12 space-y-20 pb-32">
        {/* Top Row: Rating/Actions & Storyline */}
        <div className="flex flex-col md:flex-row gap-12 lg:gap-24">
          {/* Left: Actions Card */}
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-white/2 border border-white/5 rounded-3xl p-6 flex flex-col gap-8 shadow-2xl backdrop-blur-sm">
              <div>
                <div className="text-[10px] text-white/40 font-bold tracking-[0.2em] uppercase mb-2">
                  IMDb Rating
                </div>
                <div className="text-4xl font-black flex items-center gap-3">
                  {movie.voteAverage?.toFixed(1) || '0.0'}
                  <Star className="size-6 text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handlePlayClick}
                  className="w-full bg-[#fce7c8] text-black hover:bg-white font-black py-6 rounded-xl transition-all flex items-center justify-center gap-2 text-sm tracking-wide"
                >
                  <Play className="size-4 fill-current" />
                  PLAY
                </Button>
                <Button
                  variant="outline"
                  onClick={toggleWatchlist}
                  className={`w-full py-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-xs tracking-wide border-white/10 ${
                    inWatchlist
                      ? 'bg-white/10 text-white'
                      : 'bg-transparent text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {inWatchlist ? <Check className="size-4" /> : <Star className="size-4" />}
                  WATCHLIST
                </Button>
              </div>
            </div>
          </div>

          {/* Right: Storyline */}
          <div className="flex-1 space-y-6 max-w-3xl pt-2">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/90">
              Storyline
            </h2>
            <p className="text-base md:text-lg text-white/60 leading-relaxed font-medium">
              {movie.overview || 'No synopsis is available for this title.'}
            </p>
            {movie.tagline && (
              <p className="text-sm text-[#fce7c8] italic font-bold tracking-wide">
                {movie.tagline}
              </p>
            )}
          </div>
        </div>

        {/* Cast Section */}
        {movie.cast && movie.cast.length > 0 && (
          <div className="space-y-8 pt-4">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/90">Cast</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-4 lg:gap-6">
              {movie.cast.slice(0, 8).map((member) => (
                <div key={member.id || member.name} className="group space-y-3">
                  <div className="aspect-2/3 w-full rounded-2xl overflow-hidden bg-white/5 border border-white/5">
                    {member.profilePath ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w300${member.profilePath.startsWith('/') ? member.profilePath : `/${member.profilePath}`}`}
                        alt={member.name}
                        className="h-full w-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-3xl font-black text-white/10 uppercase">
                        {member.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-extrabold text-white leading-tight">
                      {member.name}
                    </p>
                    <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider">
                      {member.character}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
