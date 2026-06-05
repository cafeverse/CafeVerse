import React, { useState, useEffect, useRef } from 'react'
import { Loader2, ChevronDown } from 'lucide-react'
import type { MediaItem, Episode, SeasonMeta } from '@/types'

const API_BASE = 'https://cafeverce-api.vercel.app'

export interface MediaPlayerProps {
  item: MediaItem
  currentSeason?: number
  currentEpisode?: number
  onSeasonChange?: (season: number) => void
  onEpisodeChange?: (episode: number) => void
  showSelectors?: boolean
}

export default function MediaPlayer({
  item,
  currentSeason: propSeason,
  currentEpisode: propEpisode,
  onSeasonChange,
  onEpisodeChange,
  showSelectors = true
}: MediaPlayerProps): React.JSX.Element {
  const isTv = item.contentType === 'tv'

  // Player & Iframe states
  const [iframeLoaded, setIframeLoaded] = useState(false)

  // TV Show specific states
  const [seasons, setSeasons] = useState<SeasonMeta[]>([])
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [localSeason, setLocalSeason] = useState(1)
  const [localEpisode, setLocalEpisode] = useState(1)

  const currentSeason = propSeason !== undefined ? propSeason : localSeason
  const currentEpisode = propEpisode !== undefined ? propEpisode : localEpisode

  const setCurrentSeason = onSeasonChange || setLocalSeason
  const setCurrentEpisode = onEpisodeChange || setLocalEpisode

  const [loadingSeasons, setLoadingSeasons] = useState(false)
  const [loadingEpisodes, setLoadingEpisodes] = useState(false)

  const playerRef = useRef<HTMLDivElement>(null)

  // Fetch seasons for TV Show
  useEffect(() => {
    if (!isTv) return
    const timer = setTimeout(() => {
      setLoadingSeasons(true)
      const fetchSeasons = async (): Promise<void> => {
        try {
          const showId = item.id || item.tmdbId
          const res = await fetch(`${API_BASE}/tv/${item.slug || showId}/seasons`).catch(() =>
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
          const count = item.numberOfSeasons || 1
          const fallback = Array.from({ length: count }, (_, i) => ({
            id: i + 1,
            seasonNumber: i + 1,
            name: `Season ${i + 1}`,
            episodeCount: item.numberOfEpisodes ? Math.round(item.numberOfEpisodes / count) : 10
          }))
          setSeasons(fallback)
        } finally {
          setLoadingSeasons(false)
        }
      }
      fetchSeasons()
    }, 0)

    return () => clearTimeout(timer)
  }, [isTv, item, setCurrentSeason])

  // Fetch episodes for selected Season
  useEffect(() => {
    if (!isTv || currentSeason === undefined || currentSeason === null) return
    const timer = setTimeout(() => {
      setLoadingEpisodes(true)
      const fetchEpisodes = async (): Promise<void> => {
        try {
          const showId = item.id || item.tmdbId
          let res = await fetch(
            `${API_BASE}/tv/${item.slug || showId}/seasons/${currentSeason}/episodes`
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
  }, [isTv, currentSeason, item, seasons, setCurrentEpisode])

  // Discord RPC Rich Presence Update
  useEffect(() => {
    if (!item) return

    const posterUrl = item.posterPath
      ? item.posterPath.startsWith('http')
        ? item.posterPath
        : `https://image.tmdb.org/t/p/w500${item.posterPath.startsWith('/') ? '' : '/'}${item.posterPath}`
      : 'logo'

    const details = item.title || item.name
    const state = isTv ? `Season ${currentSeason}, Episode ${currentEpisode}` : 'Watching a Movie'

    window.api?.discord?.updateActivity({
      details,
      state,
      startTimestamp: Date.now(),
      largeImageKey: posterUrl,
      largeImageText: details,
      smallImageKey: 'logo',
      smallImageText: 'CaféVerse'
    })
  }, [item, isTv, currentSeason, currentEpisode])

  // Clear RPC on Unmount
  useEffect(() => {
    return () => {
      window.api?.discord?.clearActivity()
    }
  }, [])

  const mediaId = item.imdbId
  const embedUrl = isTv
    ? `https://vaplayer.ru/embed/tv/${mediaId}/${currentSeason}/${currentEpisode}`
    : `https://vaplayer.ru/embed/movie/${mediaId}`

  return (
    <div
      ref={playerRef}
      className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700"
    >
      {/* Main Video Screen Container */}
      <div className="relative w-full aspect-video overflow-hidden bg-black">
        {!iframeLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#09090b]/90 z-10">
            <Loader2 className="size-10 text-primary animate-spin" />
            <p className="text-[10px] text-muted-foreground/75 font-black uppercase tracking-widest animate-pulse">
              Buffering stream details...
            </p>
          </div>
        )}
        <iframe
          id="media-iframe"
          key={embedUrl}
          src={embedUrl}
          title={`Watch ${item.title || item.name}`}
          className="w-full h-full"
          allowFullScreen
          allow="fullscreen; picture-in-picture"
          onLoad={() => setIframeLoaded(true)}
        />
      </div>

      {/* TV Season / Episode selectors below screen */}
      {isTv && showSelectors && seasons.length > 0 && (
        <div className="space-y-4 bg-muted/5 border border-border/10 p-5 animate-in fade-in duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/10 pb-4">
            <div className="space-y-1">
              <span className="text-[9.5px] uppercase tracking-[0.25em] text-primary font-black block">
                Browse Series Seasons
              </span>
              <h4 className="text-sm font-black text-white">Select Season & Episode</h4>
            </div>

            {/* Season selection dropdown */}
            <div className="relative flex items-center">
              {loadingSeasons ? (
                <Loader2 className="size-4 animate-spin text-primary mr-2" />
              ) : (
                <>
                  <select
                    value={currentSeason}
                    onChange={(e) => {
                      setCurrentSeason(parseInt(e.target.value))
                      setIframeLoaded(false)
                    }}
                    className="h-9.5 bg-muted hover:bg-muted/80 border border-border/40 hover:border-primary/20 text-white font-extrabold text-[11px] uppercase tracking-wider px-3 pr-8 outline-hidden focus:ring-1 focus:ring-primary cursor-pointer transition-all appearance-none"
                  >
                    {seasons.map((s) => (
                      <option
                        key={s.seasonNumber}
                        value={s.seasonNumber}
                        className="bg-background font-bold text-xs py-2"
                      >
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="size-3.5 absolute right-2.5 top-3 pointer-events-none text-muted-foreground/60" />
                </>
              )}
            </div>
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
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-56 overflow-y-auto pr-1">
              {episodes.map((ep) => {
                const isActive = ep.episodeNumber === currentEpisode
                return (
                  <button
                    key={ep.id}
                    onClick={() => {
                      setCurrentEpisode(ep.episodeNumber)
                      setIframeLoaded(false)
                    }}
                    className={`p-3 text-[10px] font-extrabold text-left border transition-all cursor-pointer truncate ${
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
      )}
    </div>
  )
}
