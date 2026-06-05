import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import {
  Film,
  Tv,
  Star,
  Play,
  Plus,
  Check,
  Clock,
  Sparkles,
  Info,
  X,
  Flame,
  HelpCircle,
  Bookmark
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { MediaItem, Episode } from '@/types'
import MediaRow from '@/components/media-row'
import SearchBar from '@/components/search-bar'
import { SearchResultsPanel } from '@/components/search-results'
import { useSearch } from '@/hooks/use-search'

const apiBaseUrl = 'https://cafeverce-api.vercel.app/'

export default function DashboardPage(): React.JSX.Element {
  const navigate = useNavigate()
  // Grab TMDB Image Helper from RootLayout context if available
  const { getImageUrl } = useOutletContext<{
    getImageUrl: (path?: string) => string
  }>()

  // 2. Dashboard Media Content States
  const [featuredMedia, setFeaturedMedia] = useState<MediaItem[]>([])
  const [featuredIndex, setFeaturedIndex] = useState(0)

  const [trendingMovies, setTrendingMovies] = useState<MediaItem[]>([])
  const [trendingTv, setTrendingTv] = useState<MediaItem[]>([])
  const [recentMovies, setRecentMovies] = useState<MediaItem[]>([])
  const [recentTv, setRecentTv] = useState<MediaItem[]>([])

  const [loading, setLoading] = useState<Record<string, boolean>>({
    featured: true,
    trendingMovies: true,
    trendingTv: true,
    recentMovies: true,
    recentTv: true
  })

  const [errors, setErrors] = useState<Record<string, string | null>>({
    featured: null,
    trendingMovies: null,
    trendingTv: null,
    recentMovies: null,
    recentTv: null
  })

  // 3. Search state
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    results: searchResults,
    isSearching,
    type: searchType,
    setType: setSearchType,
    clear: clearSearch
  } = useSearch()

  // 4. Watchlist state (persisted to localStorage)
  const [watchlist, setWatchlist] = useState<MediaItem[]>(() => {
    try {
      const saved = localStorage.getItem('cafeverse_watchlist')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // 5. Simulated Video Player State
  const [isPlaying, setIsPlaying] = useState(false)
  const [playerVolume, setPlayerVolume] = useState(80)
  const [playerProgress, setPlayerProgress] = useState(0)
  const [playerDuration] = useState(7200) // 2 hours default in seconds
  const [playTime, setPlayTime] = useState(0)
  const [playEpisode, setPlayEpisode] = useState<Episode | null>(null)

  // Interval reference for featured media auto-play
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null)

  // ==========================================
  // API FETCH HELPER (Dynamic Fallbacks)
  // ==========================================
  const fetchFromApi = useCallback(async (endpoint: string) => {
    const cleanBase = apiBaseUrl.replace(/\/$/, '')
    const cleanEndpoint = endpoint.replace(/^\//, '')

    // 1. Try direct route (Postman format e.g. /tv/trending)
    try {
      const res = await fetch(`${cleanBase}/${cleanEndpoint}`)
      if (res.ok) {
        return await res.json()
      }
    } catch (e) {
      console.warn(`Direct endpoint fetch failed for ${endpoint}:`, e)
    }

    // 2. Try nested /api route (Legacy/alternate backend mapping)
    try {
      const res = await fetch(`${cleanBase}/api/${cleanEndpoint}`)
      if (res.ok) {
        return await res.json()
      }
    } catch (e) {
      console.error(`API route fetch failed for ${endpoint}:`, e)
    }

    throw new Error(`Failed to fetch ${endpoint} from ${cleanBase}`)
  }, [])

  // Sync watchlist to localStorage
  const toggleWatchlist = (item: MediaItem): void => {
    const isSaved = watchlist.some((w) => w.id === item.id && w.contentType === item.contentType)
    let updated: MediaItem[] = []
    if (isSaved) {
      updated = watchlist.filter((w) => !(w.id === item.id && w.contentType === item.contentType))
    } else {
      updated = [...watchlist, item]
    }
    setWatchlist(updated)
    localStorage.setItem('cafeverse_watchlist', JSON.stringify(updated))
  }

  const isItemInWatchlist = (item: MediaItem): boolean => {
    return watchlist.some((w) => w.id === item.id && w.contentType === item.contentType)
  }

  // Safe fallback backdrop image generator
  const getBackdrop = (item?: MediaItem): string => {
    if (!item) return ''
    if (item.backdropPath) return getImageUrl(item.backdropPath)
    if (item.posterPath) return getImageUrl(item.posterPath)
    return 'linear-gradient(to right, var(--color-muted), var(--color-background))'
  }

  const getPoster = (item?: MediaItem): string => {
    if (!item) return ''
    if (item.posterPath) return getImageUrl(item.posterPath)
    return ''
  }

  // ==========================================
  // CONTENT INITIALIZER (Fires on API change)
  // ==========================================
  const loadDashboardData = useCallback(async () => {
    // Reset load states
    setLoading({
      featured: true,
      trendingMovies: true,
      trendingTv: true,
      recentMovies: true,
      recentTv: true
    })
    setErrors({
      featured: null,
      trendingMovies: null,
      trendingTv: null,
      recentMovies: null,
      recentTv: null
    })

    const resolveList = (res: unknown): MediaItem[] => {
      if (Array.isArray(res)) return res as MediaItem[]
      if (res && typeof res === 'object') {
        const obj = res as Record<string, unknown>
        if (Array.isArray(obj.data)) return obj.data as MediaItem[]
        if (Array.isArray(obj.items)) return obj.items as MediaItem[]
        if (Array.isArray(obj.results)) return obj.results as MediaItem[]
      }
      return []
    }

    // 1. Load Featured Titles
    try {
      const [featMovies, featTv] = await Promise.all([
        fetchFromApi('/movies/featured').catch(() => []),
        fetchFromApi('/tv/featured').catch(() => [])
      ])
      const combined = [...resolveList(featMovies), ...resolveList(featTv)]
      if (combined.length > 0) {
        setFeaturedMedia(combined)
        setErrors((prev) => ({ ...prev, featured: null }))
      } else {
        // Fallback to general list if featured is empty
        const fallback = await fetchFromApi('/media?limit=10').catch(() => [])
        const list = resolveList(fallback)
        if (list.length > 0) {
          setFeaturedMedia(list)
        } else {
          setErrors((prev) => ({ ...prev, featured: 'No featured media available.' }))
        }
      }
    } catch {
      setErrors((prev) => ({ ...prev, featured: 'Failed to fetch featured content.' }))
    } finally {
      setLoading((prev) => ({ ...prev, featured: false }))
    }

    // Helper wrapper to fetch and populate specific rows
    const fetchRow = async (
      endpoint: string,
      setData: React.Dispatch<React.SetStateAction<MediaItem[]>>,
      rowKey: string
    ): Promise<void> => {
      try {
        const res = await fetchFromApi(endpoint)
        const list = resolveList(res)
        setData(list)
      } catch {
        // Safe degrade to general search / index endpoints
        try {
          const fallbackPath = endpoint.includes('movies') ? '/movies?limit=20' : '/tv?limit=20'
          const res = await fetchFromApi(fallbackPath)
          setData(resolveList(res))
        } catch {
          setErrors((prev) => ({ ...prev, [rowKey]: `Could not load row data` }))
        }
      } finally {
        setLoading((prev) => ({ ...prev, [rowKey]: false }))
      }
    }

    // Trigger all content rows parallelly
    fetchRow('/movies/trending', setTrendingMovies, 'trendingMovies')
    fetchRow('/tv/trending', setTrendingTv, 'trendingTv')
    fetchRow('/movies/recently-added', setRecentMovies, 'recentMovies')
    fetchRow('/tv/recently-added', setRecentTv, 'recentTv')
  }, [fetchFromApi])

  // Setup auto-play spotlight cycle
  useEffect(() => {
    console.log(featuredMedia.length)
    if (featuredMedia.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setFeaturedIndex((prev) => (prev + 1) % featuredMedia.length)
      }, 8000)
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current)
    }
  }, [featuredMedia])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDashboardData()
    }, 0)
    return () => clearTimeout(timer)
  }, [loadDashboardData])

  const getSlug = (item: MediaItem): string => item.slug || String(item.id)

  // Handle open detail page
  const openMediaDetails = (media: MediaItem): void => {
    const slug = getSlug(media)
    if (media.contentType === 'tv') {
      navigate(`/tv/${slug}`)
    } else {
      navigate(`/movies/${slug}`)
    }
  }

  // Simulated Player state clock logic
  useEffect(() => {
    let playTimer: NodeJS.Timeout
    if (isPlaying) {
      playTimer = setInterval(() => {
        setPlayTime((prev) => {
          if (prev >= playerDuration) {
            setIsPlaying(false)
            return 0
          }
          const next = prev + 12 // speed up playing simulator slightly for visual satisfaction
          setPlayerProgress(Math.round((next / playerDuration) * 100))
          return next
        })
      }, 1000)
    }
    return () => clearInterval(playTimer)
  }, [isPlaying, playerDuration])

  const startPlayback = (episode?: Episode): void => {
    if (episode) {
      setPlayEpisode(episode)
    } else {
      setPlayEpisode(null)
    }
    setPlayTime(0)
    setPlayerProgress(0)
    setIsPlaying(true)
  }
  const formatTime = (secs: number): string => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    return `${h > 0 ? `${h}:` : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Active Spotlit Item
  const activeSpotlight = featuredMedia[featuredIndex]

  return (
    <div className="min-h-full pb-16 bg-background text-foreground flex flex-col font-sans select-none antialiased animate-fade-in">
      {/* 1. SEARCH BAR */}
      <section className="sticky top-0 z-30 px-8 py-4 backdrop-blur-xl bg-background/60 border-b border-border/40 flex flex-col md:flex-row gap-4 justify-between items-center transition-all duration-300">
        <SearchBar
          query={searchQuery}
          onQueryChange={setSearchQuery}
          type={searchType}
          onTypeChange={setSearchType}
          onClear={clearSearch}
        />
      </section>

      {/* 2. SEARCH RESULTS */}
      <SearchResultsPanel
        query={searchQuery}
        results={searchResults}
        isSearching={isSearching}
        getPosterUrl={getPoster}
        onItemClick={openMediaDetails}
      />

      {/* 4. VISUALLY STUNNING SPOTLIGHT FEATURED HERO BANNER */}
      <section className="px-8 mt-2 select-none relative z-10 shrink-0">
        {loading.featured ? (
          <Skeleton className="w-full h-115 rounded-3xl bg-muted/30" />
        ) : errors.featured || featuredMedia.length === 0 ? (
          <div className="w-full h-96 border border-dashed border-border/30 rounded-3xl flex flex-col justify-center items-center p-8 bg-muted/10">
            <HelpCircle className="size-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-bold text-white/60 mb-2">
              We couldn&apos;t load the featured spotlight.
            </p>
            <Button
              size="sm"
              onClick={loadDashboardData}
              className="bg-primary cursor-pointer text-xs rounded-xl font-bold"
            >
              Try Again
            </Button>
          </div>
        ) : (
          <div className="w-full h-115 rounded-3xl relative overflow-hidden group shadow-2xl border border-border/20">
            {/* Spotlight Background Backdrop with premium layered overlays */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out scale-100 group-hover:scale-102"
              style={{ backgroundImage: `url(${getBackdrop(activeSpotlight)})` }}
            >
              <div className="absolute inset-0 bg-linear-to-r from-[#0c0a09]/95 via-[#0c0a09]/60 to-transparent" />
              <div className="absolute inset-0 bg-linear-to-t from-[#0c0a09] via-transparent to-transparent" />
              <div className="absolute inset-0 bg-radial-at-l from-black/40 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Spotlight Metadata & Descriptions */}
            <div className="absolute inset-y-0 left-0 w-full md:w-3/5 p-8 md:p-12 flex flex-col justify-center space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-primary/20 text-primary border border-primary/20 font-black text-[9px] uppercase tracking-wider rounded-md px-2 py-0.5 animate-pulse">
                  <Flame className="size-3 text-primary mr-1 fill-primary" />
                  <span>Featured Title</span>
                </Badge>

                <Badge className="bg-black/60 border border-white/10 text-[9px] font-black text-amber-400 gap-1 rounded-md px-1.5 py-0.5">
                  <Star className="size-3 fill-amber-400 stroke-none" />
                  <span>{activeSpotlight.voteAverage?.toFixed(1) || '0.0'}</span>
                </Badge>

                {activeSpotlight.releaseDate && (
                  <span className="text-[10px] text-muted-foreground font-extrabold tracking-tight">
                    {new Date(activeSpotlight.releaseDate).getFullYear()}
                  </span>
                )}
                {activeSpotlight.firstAirDate && (
                  <span className="text-[10px] text-muted-foreground font-extrabold tracking-tight">
                    {new Date(activeSpotlight.firstAirDate).getFullYear()}
                  </span>
                )}
              </div>

              <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white leading-tight italic uppercase truncate">
                {activeSpotlight.title || activeSpotlight.name}
              </h2>

              <p className="text-xs text-muted-foreground/80 leading-relaxed font-bold tracking-tight line-clamp-3 md:line-clamp-4 max-w-lg">
                {activeSpotlight.overview ||
                  'Discover the synopsis, seasons, and episodes for this featured title.'}
              </p>

              {activeSpotlight.genres && activeSpotlight.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {activeSpotlight.genres.slice(0, 3).map((g) => (
                    <Badge
                      key={g}
                      className="bg-white/5 hover:bg-white/10 border-none text-[9.5px] text-white/80 font-bold px-2 py-0.5 rounded-full select-none cursor-pointer"
                    >
                      {g}
                    </Badge>
                  ))}
                </div>
              )}

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  onClick={() => startPlayback()}
                  className="bg-primary text-primary-foreground font-black px-6 py-4.5 rounded-xl cursor-pointer hover:bg-primary/90 hover:scale-102 hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2 text-xs"
                >
                  <Play className="size-4.5 fill-current" />
                  <span>Watch Preview</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => openMediaDetails(activeSpotlight)}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black px-5 py-4.5 rounded-xl cursor-pointer transition-all flex items-center gap-2 text-xs"
                >
                  <Info className="size-4.5" />
                  <span>View Details</span>
                </Button>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={() => toggleWatchlist(activeSpotlight)}
                        className={`size-10 border text-white rounded-xl p-0 flex items-center justify-center cursor-pointer transition-all ${isItemInWatchlist(activeSpotlight) ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                      >
                        {isItemInWatchlist(activeSpotlight) ? (
                          <Check className="size-4 text-primary" />
                        ) : (
                          <Plus className="size-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-popover border border-border/40 text-popover-foreground text-[10px] font-bold p-2.5 rounded-lg shadow-xl">
                      {isItemInWatchlist(activeSpotlight)
                        ? 'Remove from Watchlist'
                        : 'Add to Watchlist'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Slider Dots */}
            {featuredMedia.length > 1 && (
              <div className="absolute bottom-6 right-8 flex gap-1.5 z-20">
                {featuredMedia.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setFeaturedIndex(i)
                      if (autoPlayRef.current) clearInterval(autoPlayRef.current)
                    }}
                    className={`h-1.5 rounded-full transition-all cursor-pointer duration-300 ${featuredIndex === i ? 'w-6 bg-primary' : 'w-1.5 bg-white/30 hover:bg-white/60'}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 5. MULTIPLE CONTENT CATEGORY ROWS (SLIDERS) */}
      <section className="px-8 mt-10 space-y-12 flex-1">
        {/* ROW 1: MY WATCHLIST (Condition-based horizontal scroll) */}
        {watchlist.length > 0 && (
          <MediaRow
            title="My Watchlist"
            icon={Bookmark}
            data={watchlist}
            onItemClick={openMediaDetails}
            getPosterUrl={getPoster}
          />
        )}

        {/* Dynamic media row template */}
        {(
          [
            {
              title: 'Trending Movies',
              data: trendingMovies,
              key: 'trendingMovies',
              icon: Film
            },
            { title: 'Trending TV Shows', data: trendingTv, key: 'trendingTv', icon: Tv },
            {
              title: 'Recently Added Movies',
              data: recentMovies,
              key: 'recentMovies',
              icon: Clock
            },
            { title: 'Recently Added TV Shows', data: recentTv, key: 'recentTv', icon: Sparkles }
          ] as const
        ).map((row) => (
          <MediaRow
            key={row.key}
            title={row.title}
            icon={row.icon}
            data={row.data}
            isLoading={loading[row.key]}
            error={errors[row.key]}
            onItemClick={openMediaDetails}
            getPosterUrl={getPoster}
          />
        ))}
      </section>

      {/* 7. IMMERSIVE GLOWING SIMULATED STREAMING MEDIA PLAYER OVERLAY */}
      {isPlaying && (
        <div className="fixed inset-0 z-50 bg-[#070505] flex items-center justify-center p-4 md:p-8 animate-in zoom-in-95 duration-200">
          <div className="w-full max-w-4xl aspect-video bg-black rounded-3xl relative overflow-hidden flex flex-col justify-end border border-white/5 shadow-2xl">
            {/* Background screen shadow mock */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-40 blur-md pointer-events-none"
              style={{ backgroundImage: `url(${getBackdrop(activeSpotlight || undefined)})` }}
            />

            {/* Streaming simulation container */}
            <div className="absolute inset-0 flex flex-col justify-center items-center gap-4 bg-linear-to-b from-black/20 via-black/80 to-black z-10">
              <div className="size-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin flex items-center justify-center">
                <Play className="size-8 text-primary fill-current animate-pulse translate-x-0.5" />
              </div>

              <div className="text-center space-y-1.5">
                <Badge className="bg-primary/20 text-primary border border-primary/20 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                  Streaming Preview
                </Badge>

                <h3 className="text-lg md:text-2xl font-black text-white italic tracking-tight uppercase leading-none">
                  {activeSpotlight?.title || activeSpotlight?.name}
                </h3>

                {playEpisode && (
                  <p className="text-xs font-black text-primary uppercase tracking-widest">
                    Season {playEpisode.seasonNumber} &bull; Episode {playEpisode.episodeNumber}{' '}
                    &bull; {playEpisode.name}
                  </p>
                )}
              </div>

              <p className="text-[10px] text-muted-foreground/60 max-w-sm text-center leading-relaxed">
                Connecting securely and buffering player settings. Please wait...
              </p>
            </div>

            {/* Media Player Controls Overlay HUD */}
            <div className="p-6 bg-linear-to-t from-black via-black/80 to-transparent relative z-20 space-y-4">
              {/* Timeline Progress Slider */}
              <div className="space-y-1">
                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden relative group/timeline cursor-pointer">
                  <div
                    className="h-full bg-primary relative rounded-full"
                    style={{ width: `${playerProgress}%` }}
                  />
                </div>

                <div className="flex justify-between text-[9px] text-muted-foreground/75 font-black tracking-wider">
                  <span>{formatTime(playTime)}</span>
                  <span>{formatTime(playerDuration)}</span>
                </div>
              </div>

              {/* Player control panel row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => setIsPlaying(false)}
                    variant="outline"
                    className="bg-white/5 border-white/15 hover:bg-white/15 text-white size-9.5 rounded-xl cursor-pointer p-0 flex items-center justify-center"
                  >
                    <X className="size-4" />
                  </Button>

                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-black">
                      Quality
                    </span>
                    <span className="text-[10px] font-black text-emerald-400">
                      1080p Full HD • Stereo
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-muted-foreground font-black uppercase">
                    Volume: {playerVolume}%
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={playerVolume}
                    onChange={(e) => setPlayerVolume(parseInt(e.target.value))}
                    className="w-20 accent-primary cursor-pointer h-1 rounded-full bg-white/10"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
