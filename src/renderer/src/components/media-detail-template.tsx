import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Star, Check, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { MediaItem, SeasonMeta, Episode } from '@/types'
import MediaPlayer from '@/components/media-player'

const API_BASE = 'https://cafeverce-api.vercel.app'
const TMDB_ORIG = 'https://image.tmdb.org/t/p/original'

interface MediaDetailTemplateProps {
  contentType: 'movie' | 'tv'
}

const getBackdrop = (item: MediaItem): string => {
  const path = item.backdropPath || item.posterPath
  if (!path) return ''
  const p = path.startsWith('/') ? path : `/${path}`
  return `${TMDB_ORIG}${p}`
}

const resolveItem = (res: unknown, type: 'movie' | 'tv'): MediaItem | null => {
  if (res && typeof res === 'object') {
    const obj = res as Record<string, unknown>

    if (obj.id) return obj as unknown as MediaItem

    let itemObj: Record<string, unknown> | null = null
    if (type === 'movie') {
      if (obj.movie && typeof obj.movie === 'object') itemObj = obj.movie as Record<string, unknown>
      else if (obj.data && typeof obj.data === 'object')
        itemObj = obj.data as Record<string, unknown>
      else if (obj.item && typeof obj.item === 'object')
        itemObj = obj.item as Record<string, unknown>
    } else {
      if (obj.tvShow && typeof obj.tvShow === 'object')
        itemObj = obj.tvShow as Record<string, unknown>
      else if (obj.media && typeof obj.media === 'object')
        itemObj = obj.media as Record<string, unknown>
      else if (obj.movie && typeof obj.movie === 'object')
        itemObj = obj.movie as Record<string, unknown>
      else if (obj.data && typeof obj.data === 'object')
        itemObj = obj.data as Record<string, unknown>
      else if (obj.item && typeof obj.item === 'object')
        itemObj = obj.item as Record<string, unknown>
    }

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

export default function MediaDetailTemplate({
  contentType
}: MediaDetailTemplateProps): React.JSX.Element {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const [media, setMedia] = useState<MediaItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isTv = contentType === 'tv'

  // TV Show specific states
  const [seasons, setSeasons] = useState<SeasonMeta[]>([])
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [currentSeason, setCurrentSeason] = useState(1)
  const [currentEpisode, setCurrentEpisode] = useState(1)
  const [loadingSeasons, setLoadingSeasons] = useState(false)
  const [loadingEpisodes, setLoadingEpisodes] = useState(false)

  // Fetch seasons for TV Show
  useEffect(() => {
    if (!isTv || !media) return
    const timer = setTimeout(() => {
      setLoadingSeasons(true)
      const fetchSeasons = async (): Promise<void> => {
        try {
          const showId = media.id || media.tmdbId
          const res = await fetch(`${API_BASE}/tv/${media.slug || showId}/seasons`).catch(() =>
            fetch(`${API_BASE}/api/tvshows/${showId}/seasons`)
          )
          if (res.ok) {
            const json = await res.json()
            const data = Array.isArray(json) ? json : json.seasons || json.data || []
            setSeasons(data)
            if (data.length > 0) {
              const hasSeason1 = data.find((s) => s.seasonNumber === 1)
              if (hasSeason1) {
                setCurrentSeason(1)
              } else {
                const firstValidSeason = data.find((s) => s.seasonNumber > 0)
                setCurrentSeason(
                  firstValidSeason ? firstValidSeason.seasonNumber : data[0].seasonNumber
                )
              }
            }
          }
        } catch (err) {
          console.error('Failed to fetch seasons:', err)
          // Fallback seasons generator
          const count = media.numberOfSeasons || 1
          const fallback = Array.from({ length: count }, (_, i) => ({
            id: i + 1,
            seasonNumber: i + 1,
            name: `Season ${i + 1}`,
            episodeCount: media.numberOfEpisodes ? Math.round(media.numberOfEpisodes / count) : 10
          }))
          setSeasons(fallback)
        } finally {
          setLoadingSeasons(false)
        }
      }
      fetchSeasons()
    }, 0)

    return () => clearTimeout(timer)
  }, [isTv, media, setCurrentSeason])

  // Fetch episodes for selected Season
  useEffect(() => {
    if (!isTv || !media || currentSeason === undefined || currentSeason === null) return
    const timer = setTimeout(() => {
      setLoadingEpisodes(true)
      const fetchEpisodes = async (): Promise<void> => {
        try {
          const showId = media.id || media.tmdbId
          let res = await fetch(
            `${API_BASE}/tv/${media.slug || showId}/seasons/${currentSeason}/episodes`
          )
          if (!res.ok) {
            res = await fetch(`${API_BASE}/api/tvshows/${showId}/seasons/${currentSeason}`)
          }
          if (res.ok) {
            const json = await res.json()
            const data = Array.isArray(json) ? json : json.episodes || json.items || json.data || []
            setEpisodes(data)
            if (data.length > 0) {
              setCurrentEpisode(data[0].episodeNumber)
            }
          }
        } catch (err) {
          console.error('Failed to fetch episodes:', err)
          // Fallback episodes generator
          const targetSeason = seasons.find((s) => s.seasonNumber === currentSeason)
          const count = targetSeason?.episodeCount || 10
          const fallback = Array.from({ length: count }, (_, i) => ({
            id: i + 1,
            episodeNumber: i + 1,
            seasonNumber: currentSeason,
            name: `Episode ${i + 1}`,
            overview: `Episode ${i + 1} of Season ${currentSeason}.`
          }))
          setEpisodes(fallback)
        } finally {
          setLoadingEpisodes(false)
        }
      }
      fetchEpisodes()
    }, 0)

    return () => clearTimeout(timer)
  }, [isTv, currentSeason, media, seasons, setCurrentEpisode])

  // Watchlist handling
  const [watchlist, setWatchlist] = useState<MediaItem[]>(() => {
    try {
      const s = localStorage.getItem('cafeverse_watchlist')
      return s ? JSON.parse(s) : []
    } catch {
      return []
    }
  })

  const inWatchlist = media
    ? watchlist.some((w) => w.id === media.id && w.contentType === media.contentType)
    : false

  const toggleWatchlist = useCallback(() => {
    if (!media) return
    setWatchlist((prev) => {
      const exists = prev.some((w) => w.id === media.id && w.contentType === media.contentType)
      const updated = exists
        ? prev.filter((w) => !(w.id === media.id && w.contentType === media.contentType))
        : [...prev, media]
      localStorage.setItem('cafeverse_watchlist', JSON.stringify(updated))
      return updated
    })
  }, [media])

  // Fetch details
  useEffect(() => {
    if (!slug) return
    const timer = setTimeout(() => {
      setLoading(true)
      setError(null)
      setMedia(null)
      setSeasons([])
      setEpisodes([])
      setCurrentSeason(1)
      setCurrentEpisode(1)

      const tryFetch = async (): Promise<void> => {
        const pathSegment = contentType === 'movie' ? 'movies' : 'tv'
        const res1 = await fetch(`${API_BASE}/${pathSegment}/${slug}`)
        if (res1.ok) {
          const item = resolveItem(await res1.json(), contentType)
          if (item) {
            setMedia(item)
            return
          }
        }

        const res2 = await fetch(`${API_BASE}/${pathSegment}/content/${slug}`)
        if (res2.ok) {
          const item = resolveItem(await res2.json(), contentType)
          if (item) {
            setMedia(item)
            return
          }
        }
        throw new Error(`${contentType === 'movie' ? 'Movie' : 'TV Show'} not found`)
      }

      tryFetch()
        .catch(() =>
          setError(
            `We could not find this ${contentType === 'movie' ? 'movie' : 'TV show'}. It may have been removed or the link is incorrect.`
          )
        )
        .finally(() => setLoading(false))
    }, 0)

    return () => clearTimeout(timer)
  }, [slug, contentType])

  if (loading) {
    return (
      <div className="min-h-full bg-background animate-pulse">
        <Skeleton className="w-full h-[65vh] rounded-none bg-muted/20" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 space-y-6">
          <Skeleton className="h-8 w-1/3 bg-muted/20" />
          <Skeleton className="h-4 w-1/4 bg-muted/20" />
          <Skeleton className="h-24 w-full max-w-3xl bg-muted/20" />
        </div>
      </div>
    )
  }

  if (error || !media) {
    return (
      <div
        role="alert"
        className="min-h-full flex flex-col items-center justify-center gap-6 p-8 bg-background text-foreground"
      >
        <AlertTriangle className="size-14 text-destructive/50" />
        <div className="text-center">
          <h2 className="text-lg font-black mb-2">
            {contentType === 'movie' ? 'Movie' : 'TV Show'} Not Found
          </h2>
          <p className="text-xs text-muted-foreground max-w-sm">{error}</p>
        </div>
        <Button
          onClick={() => navigate(contentType === 'movie' ? '/movies' : '/')}
          className="bg-primary text-primary-foreground font-black rounded-xl px-5 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ChevronLeft className="size-4" /> Back to Home
        </Button>
      </div>
    )
  }

  const backdrop = getBackdrop(media)
  const year = media.releaseDate
    ? new Date(media.releaseDate).getFullYear()
    : media.firstAirDate
      ? new Date(media.firstAirDate).getFullYear()
      : null
  const runtime = media.runtime ? formatRuntime(media.runtime) : null

  return (
    <div className="min-h-full bg-background text-foreground font-sans antialiased selection:bg-primary/20">
      <div className="relative w-full h-[65vh] min-h-112.5 overflow-hidden">
        {backdrop ? (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${backdrop})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-muted/10" />
        )}

        {/* Soft radial vignette & bottom gradient to blend into background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(9,9,11,0.4)_100%)]" />
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/50 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-r from-background/80 via-transparent to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate(contentType === 'movie' ? '/movies' : '/')}
          className="absolute top-6 left-6 md:left-12 z-20 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-background/40 border border-border/20 hover:bg-background/60 text-foreground/85 hover:text-foreground text-[11px] font-bold tracking-widest uppercase cursor-pointer backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ChevronLeft className="size-4" />
          <span>Back</span>
        </button>

        {/* Title & Meta */}
        <div className="absolute bottom-10 left-6 md:left-12 lg:left-24 z-10 max-w-4xl">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.9] text-white">
            {media.title || media.name}
          </h1>

          <div className="flex flex-wrap items-center gap-2 mt-6">
            {year && (
              <span className="text-[11px] md:text-xs font-bold tracking-widest text-foreground/85 uppercase">
                {year}
              </span>
            )}
            {year && (runtime || media.numberOfSeasons) && (
              <span className="text-muted-foreground/40">•</span>
            )}
            {contentType === 'movie' && runtime && (
              <span className="text-[11px] md:text-xs font-bold tracking-widest text-foreground/85 uppercase mr-2">
                {runtime}
              </span>
            )}
            {contentType === 'tv' && media.numberOfSeasons && (
              <span className="text-[11px] md:text-xs font-bold tracking-widest text-foreground/85 uppercase mr-2">
                {media.numberOfSeasons} {media.numberOfSeasons === 1 ? 'Season' : 'Seasons'}
              </span>
            )}
            {media.genres?.map((g) => (
              <span
                key={g}
                className="px-2 py-0.5 bg-muted/30 border border-border/20 rounded-md text-[9px] md:text-[10px] font-black text-foreground uppercase tracking-wider backdrop-blur-xs"
              >
                {g}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-350 mx-auto px-6 md:px-12 lg:px-24 py-12 space-y-20 pb-32">
        <div className="flex flex-col md:flex-row gap-12 lg:gap-24">
          {/* Left: Actions Card */}
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-muted/30 border border-border/10 rounded-3xl p-6 flex flex-col gap-8 backdrop-blur-xs">
              <div>
                <div className="text-[10px] text-muted-foreground font-bold tracking-[0.2em] uppercase mb-2">
                  IMDb Rating
                </div>
                <div className="text-4xl font-black flex items-center gap-3">
                  {media.voteAverage?.toFixed(1) || '0.0'}
                  <Star className="size-6 text-amber-400 fill-amber-400" />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  onClick={toggleWatchlist}
                  className={`w-full py-6 rounded-xl font-bold flex items-center justify-center gap-2 text-xs tracking-wide border-border/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    inWatchlist
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-transparent text-foreground/70 hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {inWatchlist ? <Check className="size-4" /> : <Star className="size-4" />}
                  WATCHLIST
                </Button>
              </div>

              {/* Extra Details */}
              <div className="space-y-3 pt-2 text-xs border-t border-border/10">
                {media.originalTitle && media.originalTitle !== media.title && (
                  <div>
                    <span className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase block">
                      Original Title
                    </span>
                    <span className="font-semibold block leading-tight mt-0.5">
                      {media.originalTitle}
                    </span>
                  </div>
                )}
                {media.originalName && media.originalName !== media.name && (
                  <div>
                    <span className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase block">
                      Original Title
                    </span>
                    <span className="font-semibold block leading-tight mt-0.5">
                      {media.originalName}
                    </span>
                  </div>
                )}
                {contentType === 'tv' && media.numberOfEpisodes && (
                  <div>
                    <span className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase block">
                      Episodes
                    </span>
                    <span className="font-semibold block mt-0.5">{media.numberOfEpisodes}</span>
                  </div>
                )}
                {media.status && (
                  <div>
                    <span className="text-[9px] text-muted-foreground font-bold tracking-wider uppercase block">
                      Status
                    </span>
                    <span className="font-semibold block mt-0.5">{media.status}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Storyline */}
          <div className="flex-1 space-y-6 max-w-3xl pt-2">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground/90">
              Storyline
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-medium">
              {media.overview || 'No synopsis is available for this title.'}
            </p>
            {media.tagline && (
              <p className="text-sm text-primary italic font-bold tracking-wide">{media.tagline}</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="w-full aspect-video overflow-hidden bg-black border border-border/10">
            <MediaPlayer
              item={media}
              currentSeason={currentSeason}
              currentEpisode={currentEpisode}
              onSeasonChange={setCurrentSeason}
              onEpisodeChange={setCurrentEpisode}
              showSelectors={false}
            />
          </div>

          {/* TV Season / Episode selectors */}
          {isTv && seasons.length > 0 && (
            <div className="space-y-6 bg-muted/5 border border-border/10 p-6 animate-in fade-in duration-500 rounded-3xl">
              {seasons.length > 1 && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="text-[9.5px] uppercase tracking-[0.25em] text-primary font-black block">
                      Browse Series Seasons
                    </span>
                    <h4 className="text-sm font-black text-white">Select Season</h4>
                  </div>

                  {/* Season selection horizontal scroll */}
                  {loadingSeasons ? (
                    <div className="py-2 flex justify-start">
                      <Loader2 className="size-4 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div
                      onWheel={(e) => {
                        if (e.deltaY !== 0) {
                          e.currentTarget.scrollLeft += e.deltaY
                        }
                      }}
                      className="flex gap-2 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 scrollbar-track-transparent"
                    >
                      {seasons.map((s) => {
                        const isActive = s.seasonNumber === currentSeason
                        return (
                          <button
                            key={s.seasonNumber}
                            onClick={() => {
                              setCurrentSeason(s.seasonNumber)
                            }}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider border rounded-xl whitespace-nowrap cursor-pointer transition-all ${
                              isActive
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-muted/30 text-white/70 border-border/20 hover:bg-muted hover:text-white'
                            }`}
                          >
                            {s.name}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              <div
                className={
                  seasons.length > 1 ? 'border-t border-border/10 pt-6 space-y-3' : 'space-y-3'
                }
              >
                <div className="space-y-1">
                  <span className="text-[9.5px] uppercase tracking-[0.25em] text-primary font-black block">
                    Choose Episode
                  </span>
                  <h4 className="text-sm font-black text-white">Episodes</h4>
                </div>

                {/* Episode items grid */}
                {loadingEpisodes ? (
                  <div className="py-8 flex justify-center">
                    <Loader2 className="size-6 text-primary animate-spin" />
                  </div>
                ) : episodes.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No episodes found for this season.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                    {episodes.map((ep) => {
                      const isActive = ep.episodeNumber === currentEpisode
                      return (
                        <button
                          key={ep.id}
                          onClick={() => {
                            setCurrentEpisode(ep.episodeNumber)
                          }}
                          className={`p-3 text-[10px] font-extrabold text-left border rounded-xl transition-all cursor-pointer truncate ${
                            isActive
                              ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20'
                              : 'bg-muted/40 text-white/80 border-border/25 hover:bg-muted hover:text-white hover:border-border/50'
                          }`}
                        >
                          <span className="block text-[8px] opacity-60 uppercase mb-0.5 tracking-wider">
                            Episode {ep.episodeNumber}
                          </span>
                          <span className="block truncate">{ep.name}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {media.cast && media.cast.length > 0 && (
          <div className="space-y-8 pt-4">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground/90">
              Cast
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-4 lg:gap-6">
              {media.cast.slice(0, 8).map((member) => (
                <div key={member.id || member.name} className="group space-y-3">
                  <div className="aspect-2/3 w-full rounded-2xl overflow-hidden bg-muted border border-border/10">
                    {member.profilePath ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w300${member.profilePath.startsWith('/') ? member.profilePath : `/${member.profilePath}`}`}
                        alt={member.name}
                        className="h-full w-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-3xl font-black text-muted-foreground uppercase">
                        {member.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-extrabold text-foreground leading-tight">
                      {member.name}
                    </p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
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
