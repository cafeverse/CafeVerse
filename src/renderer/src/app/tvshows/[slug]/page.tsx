import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { Star, ChevronLeft, Play, Tv, List, Calendar } from 'lucide-react'
import { MediaItem } from '@/types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AppContextType } from '../../layout'

interface Episode {
  id: number
  name: string
  overview: string
  episodeNumber: number
  seasonNumber: number
  airDate?: string
  stillPath?: string
  voteAverage?: number
}

interface SeasonDetails {
  id: number
  name: string
  overview: string
  seasonNumber: number
  episodes: Episode[]
}

export default function TvShowDetailPage(): React.JSX.Element {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { API_BASE_URL, getImageUrl, toggleWatchlist, isItemInWatchlist, getSlug } =
    useOutletContext<AppContextType>()

  const [show, setShow] = useState<MediaItem | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Season & Episode details states
  const [activeSeason, setActiveSeason] = useState<number>(1)
  const [activeEpisode, setActiveEpisode] = useState<number>(1)
  const [seasonDetails, setSeasonDetails] = useState<SeasonDetails | null>(null)
  const [loadingSeason, setLoadingSeason] = useState<boolean>(false)

  // Keyboard Navigation / Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const activeTag = document.activeElement?.tagName.toLowerCase()
      if (activeTag === 'input' || activeTag === 'textarea') return

      if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault()
        navigate('/tvshows')
      } else if (e.key.toLowerCase() === 'w' && show) {
        e.preventDefault()
        toggleWatchlist(show)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return (): void => window.removeEventListener('keydown', handleKeyDown)
  }, [show, navigate, toggleWatchlist])

  // Initial show details fetching
  useEffect(() => {
    const fetchShowDetails = async (): Promise<void> => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${API_BASE_URL}/api/tvshows?limit=100`)
        if (!response.ok) {
          throw new Error('Failed to load TV shows database')
        }
        const result = await response.json()
        const shows: MediaItem[] = result.data || []
        const matchedShow = shows.find((s) => getSlug(s.title || s.name) === slug)

        if (!matchedShow) {
          const parsedId = parseInt(slug || '', 10)
          if (!isNaN(parsedId)) {
            const detailRes = await fetch(`${API_BASE_URL}/api/tvshows/${parsedId}`)
            if (detailRes.ok) {
              const detailData = await detailRes.json()
              setShow(detailData)
              setLoading(false)
              return
            }
          }
          throw new Error('TV Show not found in the CaféVerse database.')
        }

        const detailRes = await fetch(`${API_BASE_URL}/api/tvshows/${matchedShow.id}`)
        if (!detailRes.ok) {
          setShow(matchedShow)
        } else {
          const detailData = await detailRes.json()
          setShow(detailData)
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'An error occurred loading TV show details'
        setError(errorMsg)
      } finally {
        setLoading(false)
      }
    }

    fetchShowDetails()
  }, [slug, API_BASE_URL, getSlug])

  // Fetch season episodes details dynamically when activeSeason changes
  useEffect(() => {
    if (!show) return

    const fetchSeasonDetails = async (): Promise<void> => {
      setLoadingSeason(true)
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/tvshows/${show.id}/seasons/${activeSeason}`
        )
        if (response.ok) {
          const data = await response.json()
          setSeasonDetails(data)
        } else {
          setSeasonDetails(null)
        }
      } catch (err) {
        console.error('Failed to fetch season details', err)
        setSeasonDetails(null)
      } finally {
        setLoadingSeason(false)
      }
    }

    fetchSeasonDetails()
  }, [show, activeSeason, API_BASE_URL])

  // Discord Activity sync on viewing/playing
  useEffect(() => {
    if (show) {
      const year = show.firstAirDate ? ` (${new Date(show.firstAirDate).getFullYear()})` : ''
      window.api?.discord?.updateActivity({
        details: `Watching ${show.title || show.name}${year}`,
        state: `Season ${activeSeason}, Episode ${activeEpisode}`,
        startTimestamp: Date.now(),
        largeImageKey: getImageUrl(show.posterPath),
        largeImageText: `${show.title || show.name} • S${activeSeason}E${activeEpisode}`,
        smallImageKey: 'play',
        smallImageText: 'Streaming now'
      })
    }

    return (): void => {
      window.api?.discord?.clearActivity()
    }
  }, [show, activeSeason, activeEpisode, getImageUrl])

  if (loading) {
    return (
      <div className="space-y-8 w-full pb-16">
        <Skeleton className="h-[60vh] w-full bg-card rounded-none" />
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-8">
            <Skeleton className="h-32 w-full bg-card rounded-none" />
            <Skeleton className="h-44 w-full bg-card rounded-none" />
          </div>
          <div className="lg:col-span-4">
            <Skeleton className="h-80 w-full bg-card rounded-none" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !show) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center gap-6">
        <div className="space-y-2">
          <h4 className="text-2xl font-black text-foreground uppercase tracking-tight">
            TV Show Unavailable
          </h4>
          <p className="text-muted-foreground">{error || 'Unable to retrieve title content.'}</p>
        </div>
        <Button
          onClick={() => navigate('/tvshows')}
          size="lg"
          className="rounded-none font-bold bg-primary text-primary-foreground hover:bg-primary transition-none cursor-pointer"
        >
          Return to Catalogue
        </Button>
      </div>
    )
  }

  // Derive total seasons count (fallback to TMDB seasons count or 1)
  const seasonsCount = show.numberOfSeasons || 1
  const seasonsArray = Array.from({ length: seasonsCount }, (_, i) => i + 1)

  return (
    <div className="w-full pb-24">
      {/* 1. Cinematic Full-Bleed Hero Banner */}
      <div className="relative w-full h-[35vh] sm:h-[50vh] md:h-[65vh] min-h-64 sm:min-h-96 md:min-h-125 mb-6 md:mb-12">
        <img
          src={getImageUrl(show.backdropPath)}
          alt={show.title || show.name}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/20 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-r from-background/90 via-background/40 to-transparent" />

        <button
          onClick={() => navigate('/tvshows')}
          className="absolute top-4 left-4 md:top-8 md:left-8 z-30 flex items-center gap-1.5 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 active:scale-95 px-3.5 py-2.5 rounded-xl border border-white/10 backdrop-blur-md cursor-pointer font-bold tracking-widest text-xs uppercase transition-all duration-300"
        >
          <ChevronLeft className="size-4" /> Back
        </button>

        <div className="absolute bottom-0 left-0 w-full px-4 sm:px-8 md:px-16 pb-6 md:pb-12 z-20">
          <div className="max-w-4xl space-y-3 md:space-y-4">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-primary/20 text-primary border border-primary/20 backdrop-blur-md">
              <Tv className="size-3" /> TV Series
            </span>
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter uppercase leading-none md:leading-[0.9] wrap-break-word">
              {show.title || show.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:text-sm md:text-base font-bold text-white/70 uppercase tracking-widest">
              <span>{show.firstAirDate ? new Date(show.firstAirDate).getFullYear() : 'N/A'}</span>
              <span>&bull;</span>
              <span>
                {seasonsCount} {seasonsCount === 1 ? 'Season' : 'Seasons'}
              </span>
              {show.numberOfEpisodes && (
                <>
                  <span>&bull;</span>
                  <span>{show.numberOfEpisodes} Episodes</span>
                </>
              )}
              <span>&bull;</span>
              <span className="text-primary">{show.genres ? show.genres[0] : 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-16 space-y-8 md:space-y-12 lg:space-y-16">
        {/* Actions & Synopsis Row */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-10">
          {/* Left actions panel */}
          <div className="flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start gap-4 bg-card/25 border border-border p-4 md:p-5 rounded-2xl md:w-56 shrink-0">
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                IMDb Rating
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl md:text-3xl font-black text-white leading-none">
                  {show.voteAverage?.toFixed(1) || 'N/A'}
                </span>
                <Star className="size-5 fill-primary text-primary" />
              </div>
            </div>

            <div className="flex flex-row md:flex-col gap-2.5">
              <button
                onClick={() => {
                  const playerEl = document.getElementById('cafeverse-player')
                  playerEl?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="flex items-center justify-center gap-2 bg-primary text-primary-foreground font-extrabold uppercase tracking-wider text-[10px] md:text-xs px-4 py-3 rounded-xl hover:bg-primary/95 active:scale-95 transition-all cursor-pointer min-h-11 shadow-lg shadow-primary/10 shrink-0"
              >
                <Play className="size-3.5 fill-primary-foreground text-primary-foreground" />
                Play S{activeSeason}E{activeEpisode}
              </button>
              <button
                onClick={() => toggleWatchlist(show)}
                className={`flex items-center justify-center gap-2 font-extrabold uppercase tracking-wider text-[10px] md:text-xs px-4 py-3 rounded-xl border active:scale-95 transition-all cursor-pointer min-h-11 shrink-0 ${
                  isItemInWatchlist(show)
                    ? 'bg-primary/10 border-primary/45 text-primary'
                    : 'bg-muted/70 border-border text-foreground hover:bg-accent'
                }`}
              >
                <Star
                  className={`size-3.5 ${isItemInWatchlist(show) ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
                />
                {isItemInWatchlist(show) ? 'Watchlisted' : 'Watchlist'}
              </button>
            </div>
          </div>

          {/* Storyline text */}
          <div className="flex-1 space-y-4 md:space-y-6 text-left">
            <h3 className="text-xl font-black uppercase tracking-widest text-foreground">
              Storyline
            </h3>
            <p className="text-base sm:text-lg text-foreground/80 leading-relaxed font-medium">
              {show.overview || 'No description available.'}
            </p>
            {show.tagline && (
              <p className="text-sm sm:text-base font-bold italic text-primary/80">
                {show.tagline}
              </p>
            )}
          </div>
        </div>

        {/* Player Embed */}
        <div id="cafeverse-player" className="space-y-6 scroll-mt-24">
          <h3 className="text-xl font-black uppercase tracking-widest text-foreground flex items-center gap-3">
            <Play className="size-5 text-primary fill-primary" />
            Now Playing: Season {activeSeason} &bull; Episode {activeEpisode}
          </h3>
          <div className="relative w-full h-125 bg-card aspect-video rounded-2xl overflow-hidden border border-border">
            <iframe
              src={`https://vaplayer.ru/embed/tv/${show.imdbId || show.tmdbId}/${activeSeason}/${activeEpisode}?color=ebd29f&secondaryColor=2e2e2e&title=false`}
              className="absolute border-0 top-[-1%] left-[-1%] w-[102%] h-[102%]"
              allowFullScreen
              allow="fullscreen; picture-in-picture"
              sandbox="allow-scripts allow-same-origin"
              title={`Watch ${show.title || show.name} S${activeSeason}E${activeEpisode}`}
            />
          </div>
        </div>

        {/* Interactive Season and Episode Selector */}
        <div className="space-y-6 md:space-y-8">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <List className="size-5 text-primary" />
            <h3 className="text-xl font-black uppercase tracking-widest text-foreground">
              Season Directory
            </h3>
          </div>

          {/* Horizontal Season Tabs */}
          <div className="flex flex-row items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {seasonsArray.map((seasonNum) => {
              const matchedSeason = show.seasons?.find((s) => s.seasonNumber === seasonNum)
              const seasonLabel = matchedSeason?.name || `Season ${seasonNum}`
              return (
                <button
                  key={seasonNum}
                  onClick={() => {
                    setActiveSeason(seasonNum)
                    setActiveEpisode(1)
                  }}
                  className={`px-6 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 cursor-pointer shrink-0 border ${
                    activeSeason === seasonNum
                      ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                      : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                  title={seasonLabel}
                >
                  {seasonLabel}
                </button>
              )
            })}
          </div>

          {/* Episodes Explorer */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Episode Directory (Season {activeSeason})
              </span>
            </div>

            {loadingSeason ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-2">
                {Array.from({ length: 12 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-12 w-full bg-card rounded-xl" />
                ))}
              </div>
            ) : seasonDetails && seasonDetails.episodes && seasonDetails.episodes.length > 0 ? (
              <div className="space-y-6">
                {/* High Density Episode Selector Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
                  {seasonDetails.episodes.map((ep) => {
                    const isActive = activeEpisode === ep.episodeNumber
                    return (
                      <button
                        key={ep.id}
                        onClick={() => {
                          setActiveEpisode(ep.episodeNumber)
                          const playerEl = document.getElementById('cafeverse-player')
                          playerEl?.scrollIntoView({ behavior: 'smooth' })
                        }}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          isActive
                            ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                            : 'bg-card/40 border-border text-foreground hover:bg-accent/60'
                        }`}
                      >
                        <span
                          className={`text-[8px] font-bold uppercase tracking-wider ${isActive ? 'text-primary-foreground/75' : 'text-muted-foreground'}`}
                        >
                          Ep
                        </span>
                        <span className="text-sm font-black leading-none mt-0.5">
                          {ep.episodeNumber}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Selected Episode Cinematic Overview details card */}
                {(() => {
                  const currentEp =
                    seasonDetails.episodes.find((e) => e.episodeNumber === activeEpisode) ||
                    seasonDetails.episodes[0]
                  if (!currentEp) return null

                  return (
                    <div className="flex flex-col md:flex-row gap-5 p-5 rounded-2xl bg-card/25 border border-border/80 text-left">
                      <div className="flex-1 space-y-3 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h4 className="font-black text-base uppercase tracking-wider text-white">
                            Episode {currentEp.episodeNumber} &bull;{' '}
                            {currentEp.name || `Episode ${currentEp.episodeNumber}`}
                          </h4>
                          {currentEp.airDate && (
                            <span className="text-[10px] text-muted-foreground/80 font-extrabold shrink-0 flex items-center gap-1">
                              <Calendar className="size-3.5 text-primary" />
                              {new Date(currentEp.airDate).toLocaleDateString(undefined, {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                          {currentEp.overview ||
                            'No synopsis description is available for this episode.'}
                        </p>
                      </div>
                    </div>
                  )
                })()}
              </div>
            ) : (
              // Fallback if API does not return episodes - dynamically generate basic index lists based on numbers
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
                {Array.from(
                  {
                    length: show.numberOfEpisodes
                      ? Math.ceil(show.numberOfEpisodes / seasonsCount)
                      : 10
                  },
                  (_, idx) => idx + 1
                ).map((epNum) => {
                  const isActive = activeEpisode === epNum
                  return (
                    <button
                      key={epNum}
                      onClick={() => {
                        setActiveEpisode(epNum)
                        const playerEl = document.getElementById('cafeverse-player')
                        playerEl?.scrollIntoView({ behavior: 'smooth' })
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        isActive
                          ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                          : 'bg-card/40 border-border text-foreground hover:bg-accent/60'
                      }`}
                    >
                      <span
                        className={`text-[8px] font-bold uppercase tracking-wider ${isActive ? 'text-primary-foreground/75' : 'text-muted-foreground'}`}
                      >
                        Ep
                      </span>
                      <span className="text-sm font-black leading-none mt-0.5">{epNum}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Cast */}
        {show.cast && show.cast.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-xl font-black uppercase tracking-widest text-foreground">Cast</h3>
            <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
              {show.cast.map((c, i) => (
                <div key={i} className="flex flex-col w-32 shrink-0 gap-3">
                  {c.profilePath ? (
                    <div className="w-full aspect-2/3 overflow-hidden rounded-xl bg-muted">
                      <img
                        src={getImageUrl(c.profilePath)}
                        alt={c.name}
                        className="h-full w-full object-cover grayscale opacity-80 md:hover:grayscale-0 md:hover:opacity-100 transition-all duration-300"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-2/3 bg-card flex items-center justify-center rounded-xl border border-border">
                      <span className="text-xl font-black text-muted-foreground uppercase">
                        {c.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-foreground leading-tight">
                      {c.name}
                    </span>
                    <span className="text-xs text-muted-foreground uppercase tracking-widest line-clamp-2">
                      {c.character}
                    </span>
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
