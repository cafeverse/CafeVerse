import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Search,
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
  AlertTriangle,
  Flame,
  PlayCircle,
  HelpCircle,
  Bookmark
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { MediaItem, SeasonMeta, Episode } from '@/types'
import MediaRow from '@/components/media-row'

const apiBaseUrl = 'https://cafeverce-api.vercel.app/'

export default function DashboardPage(): React.JSX.Element {
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

  // 3. Search & Watchlist States
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<MediaItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchType, setSearchType] = useState<'all' | 'movie' | 'tv'>('all')
  const [watchlist, setWatchlist] = useState<MediaItem[]>(() => {
    try {
      const saved = localStorage.getItem('cafeverse_watchlist')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // 4. Immersive Media Details Drawer State
  const [activeMedia, setActiveMedia] = useState<MediaItem | null>(null)
  const [seasons, setSeasons] = useState<SeasonMeta[]>([])
  const [loadingSeasons, setLoadingSeasons] = useState(false)
  const [selectedSeasonNum, setSelectedSeasonNum] = useState<number | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [loadingEpisodes, setLoadingEpisodes] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'episodes'>('overview')

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
        const fallback = await fetchFromApi('/media?limit=5').catch(() => [])
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
          const fallbackPath = endpoint.includes('movies') ? '/movies?limit=10' : '/tv?limit=10'
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

  // ==========================================
  // REAL-TIME SEARCH ENGINE
  // ==========================================
  useEffect(() => {
    if (!searchQuery.trim()) {
      const timer = setTimeout(() => {
        setSearchResults([])
        setIsSearching(false)
      }, 0)
      return () => clearTimeout(timer)
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true)
      try {
        // Query /search endpoint with parameters
        const urlParams = new URLSearchParams({
          q: searchQuery,
          page: '1',
          limit: '12'
        })
        if (searchType !== 'all') {
          urlParams.append('type', searchType)
        }

        const data = await fetchFromApi(`/search?${urlParams.toString()}`)
        if (Array.isArray(data)) {
          setSearchResults(data)
        } else if (data && data.data) {
          setSearchResults(data.data)
        } else if (data && data.items) {
          setSearchResults(data.items)
        } else if (data && data.results) {
          setSearchResults(data.results)
        } else {
          setSearchResults([])
        }
      } catch (e) {
        console.error('Instant search query failed:', e)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 400) // 400ms search throttle debouncer

    return () => clearTimeout(delayDebounce)
  }, [searchQuery, searchType, fetchFromApi])

  // ==========================================
  // IMMERSIVE MEDIA SEASONS & EPISODES LAZY-LOAD
  // ==========================================
  const loadEpisodes = useCallback(
    async (show: MediaItem, seasonNum: number): Promise<void> => {
      setLoadingEpisodes(true)
      setEpisodes([])

      const showId = show.id || show.tmdbId
      const cleanBase = apiBaseUrl.replace(/\/$/, '')

      try {
        // 1. Try standard Postman route: /tv/:idOrSlug/seasons/:season/episodes
        let res = await fetch(
          `${cleanBase}/tv/${show.slug || showId}/seasons/${seasonNum}/episodes`
        )

        // 2. Try legacy API.md route fallback: /api/tvshows/:id/seasons/:season
        if (!res.ok) {
          res = await fetch(`${cleanBase}/api/tvshows/${showId}/seasons/${seasonNum}`)
        }

        if (res.ok) {
          const json = await res.json()
          let epList = Array.isArray(json) ? json : json.episodes || json.items || json.data || []

          // Dynamic zero-latency fallback episode generator as described in API.md features!
          if (epList.length === 0) {
            const targetSeason = seasons.find((s) => s.seasonNumber === seasonNum)
            const count = targetSeason?.episodeCount || 10
            epList = Array.from({ length: count }, (_, i) => ({
              id: i + 1,
              episodeNumber: i + 1,
              seasonNumber: seasonNum,
              name: `Episode ${i + 1}`,
              overview: `Join your favorite characters in this exciting episode ${i + 1} of Season ${seasonNum}. Discover what happens next as the adventure unfolds!`,
              stillPath: null
            }))
          }
          setEpisodes(epList)
        }
      } catch (e) {
        console.error('Failed to fetch episodes:', e)
        // Ep list fallback
        const targetSeason = seasons.find((s) => s.seasonNumber === seasonNum)
        const count = targetSeason?.episodeCount || 10
        const epList = Array.from({ length: count }, (_, i) => ({
          id: i + 1,
          episodeNumber: i + 1,
          seasonNumber: seasonNum,
          name: `Episode ${i + 1}`,
          overview: `Join your favorite characters in this exciting episode ${i + 1} of Season ${seasonNum}. Discover what happens next as the adventure unfolds!`,
          stillPath: null
        }))
        setEpisodes(epList)
      } finally {
        setLoadingEpisodes(false)
      }
    },
    [seasons]
  )

  const loadTvDetails = useCallback(
    async (show: MediaItem): Promise<void> => {
      setLoadingSeasons(true)
      setSeasons([])
      setSelectedSeasonNum(null)
      setEpisodes([])
      setDetailsError(null)
      setActiveTab('overview')

      try {
        const showId = show.id || show.tmdbId
        const cleanBase = apiBaseUrl.replace(/\/$/, '')

        // 1. Fetch seasons
        let seasonsData: SeasonMeta[] = []
        try {
          // Postman route: /tv/:idOrSlug/seasons
          const res = await fetch(`${cleanBase}/tv/${show.slug || showId}/seasons`).catch(() =>
            fetch(`${cleanBase}/api/tvshows/${showId}/seasons`)
          )
          if (res.ok) {
            const json = await res.json()
            seasonsData = Array.isArray(json) ? json : json.seasons || json.data || []
          }
        } catch {
          console.warn('Failed to fetch seasons, falling back')
        }

        // Fallback generator if seasons endpoint didn't respond
        if (seasonsData.length === 0) {
          const count = show.numberOfSeasons || 1
          seasonsData = Array.from({ length: count }, (_, i) => ({
            id: i + 1,
            seasonNumber: i + 1,
            name: `Season ${i + 1}`,
            episodeCount: show.numberOfEpisodes
              ? Math.round(show.numberOfEpisodes / count)
              : undefined
          }))
        }

        setSeasons(seasonsData)

        // Auto-load episodes for the first season
        if (seasonsData.length > 0) {
          const firstSeason = seasonsData[0].seasonNumber
          setSelectedSeasonNum(firstSeason)
          loadEpisodes(show, firstSeason)
        }
      } catch (e) {
        console.error('Failed to fetch season details:', e)
        setDetailsError('Could not fetch seasons list.')
      } finally {
        setLoadingSeasons(false)
      }
    },
    [loadEpisodes]
  )

  // Handle open detail modal
  const openMediaDetails = (media: MediaItem): void => {
    setActiveMedia(media)
    if (media.contentType === 'tv') {
      loadTvDetails(media)
    } else {
      setSeasons([])
      setEpisodes([])
      setSelectedSeasonNum(null)
      setActiveTab('overview')
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
      {/* 1. LIVE INSTANT SEARCH */}
      <section className="sticky top-0 z-30 px-8 py-4 backdrop-blur-xl bg-background/60 border-b border-border/40 flex flex-col md:flex-row gap-4 justify-between items-center transition-all duration-300">
        {/* Global Search Bar */}
        <div className="flex w-full md:w-96 items-center bg-muted/40 border border-border/40 rounded-full px-3 py-1 text-xs shadow-inner focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-300">
          <Search className="size-4 text-muted-foreground/60 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search movies, TV shows, and genres..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-0 outline-hidden py-1.5 text-white placeholder-muted-foreground/60 w-full"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground cursor-pointer"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </section>

      {/* 2. LIVE SEARCH RESULTS OVERLAY PANEL */}
      {searchQuery && (
        <section className="px-8 mt-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-4 border-b border-border/30 pb-2">
            <h2 className="text-md font-black tracking-tight text-white flex items-center gap-2">
              <Search className="size-4.5 text-primary" />
              <span>Search Results for &quot;{searchQuery}&quot;</span>
            </h2>
            <div className="flex gap-1">
              {(['all', 'movie', 'tv'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSearchType(type)}
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase cursor-pointer transition-all ${searchType === type ? 'bg-primary text-primary-foreground' : 'bg-muted/40 text-muted-foreground/70 hover:bg-muted hover:text-white'}`}
                >
                  {type === 'all' ? 'All Content' : type === 'movie' ? 'Movies' : 'TV Shows'}
                </button>
              ))}
            </div>
          </div>

          {isSearching ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-2/3 w-full rounded-xl bg-muted" />
                  <Skeleton className="h-4 w-3/4 bg-muted" />
                  <Skeleton className="h-3 w-1/2 bg-muted" />
                </div>
              ))}
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-muted/10 border border-border/20 rounded-2xl text-center">
              <AlertTriangle className="size-10 text-amber-500/60 mb-3 animate-bounce" />
              <p className="text-sm font-bold text-white mb-1">No matches found.</p>
              <p className="text-xs text-muted-foreground/60 max-w-sm">
                Try searching for a different title, or check back later once new content is added.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {searchResults.map((item) => (
                <div
                  key={`${item.contentType}-${item.id}`}
                  onClick={() => openMediaDetails(item)}
                  className="group relative cursor-pointer overflow-hidden rounded-xl border border-border/40 hover:border-primary/20 bg-muted/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 shadow-2xs"
                >
                  <div className="aspect-2/3 w-full overflow-hidden bg-muted relative">
                    {getPoster(item) ? (
                      <img
                        src={getPoster(item)}
                        alt={item.title || item.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full bg-linear-to-br from-muted/50 to-background flex flex-col items-center justify-center p-3 text-center">
                        {item.contentType === 'movie' ? (
                          <Film className="size-8 text-muted-foreground/35 mb-2" />
                        ) : (
                          <Tv className="size-8 text-muted-foreground/35 mb-2" />
                        )}
                        <span className="text-[10px] font-black tracking-tight text-muted-foreground/75 truncate w-full">
                          {item.title || item.name}
                        </span>
                      </div>
                    )}

                    {/* Hover play trigger */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                      <PlayCircle className="size-11 text-primary drop-shadow-md shadow-primary" />
                    </div>

                    <Badge className="absolute top-2.5 right-2.5 bg-black/70 border border-white/10 text-[9px] font-black text-amber-400 gap-1 rounded-md px-1.5 py-0.5">
                      <Star className="size-2.5 fill-amber-400 stroke-none" />
                      <span>{item.voteAverage?.toFixed(1) || '0.0'}</span>
                    </Badge>

                    <Badge className="absolute bottom-2.5 left-2.5 bg-primary border-none text-[8px] font-black text-primary-foreground uppercase tracking-widest px-1.5 py-0.5 rounded-md">
                      {item.contentType === 'movie' ? 'Movie' : 'TV Show'}
                    </Badge>
                  </div>
                  <div className="p-3">
                    <h3 className="font-extrabold text-xs tracking-tight text-white leading-tight truncate group-hover:text-primary transition-colors">
                      {item.title || item.name}
                    </h3>
                    <p className="text-[9px] text-muted-foreground/60 mt-1">
                      {item.releaseDate
                        ? new Date(item.releaseDate).getFullYear()
                        : item.firstAirDate
                          ? new Date(item.firstAirDate).getFullYear()
                          : 'N/A'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Separator className="bg-border/30 my-8" />
        </section>
      )}

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

      {/* 6. PREMIUM FLOATING MEDIA DETAILS DRAWER / MODAL OVERLAY */}
      {activeMedia && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 md:p-8 animate-in fade-in duration-300 select-none">
          <div className="bg-[#0e0c0b] border border-border/40 w-full max-w-5xl h-full max-h-[85vh] rounded-3xl flex flex-col md:flex-row overflow-hidden relative shadow-2xl">
            {/* Close modal */}
            <button
              onClick={() => setActiveMedia(null)}
              className="absolute top-4 right-4 z-50 p-2 rounded-xl bg-black/60 hover:bg-black border border-white/10 hover:border-primary/20 text-white cursor-pointer transition-colors"
            >
              <X className="size-4.5" />
            </button>

            {/* Poster Sidebar on Large Screens */}
            <div className="w-full md:w-80 border-r border-border/30 bg-[#070505] p-6 hidden md:flex flex-col justify-start shrink-0">
              <div className="aspect-2/3 w-full rounded-2xl overflow-hidden shadow-2xl border border-white/5 relative">
                {getPoster(activeMedia) ? (
                  <img
                    src={getPoster(activeMedia)}
                    alt={activeMedia.title || activeMedia.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-muted flex items-center justify-center">
                    <Film className="size-12 text-muted-foreground/20" />
                  </div>
                )}
              </div>

              {/* Media specifications */}
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between text-xs border-b border-border/20 pb-2">
                  <span className="text-muted-foreground font-bold">Type</span>
                  <Badge className="bg-primary text-primary-foreground border-none font-black text-[9px] uppercase">
                    {activeMedia.contentType === 'movie' ? 'Movie' : 'TV Show'}
                  </Badge>
                </div>

                {activeMedia.releaseDate && (
                  <div className="flex items-center justify-between text-xs border-b border-border/20 pb-2">
                    <span className="text-muted-foreground font-bold">Release Date</span>
                    <span className="text-white font-extrabold">
                      {new Date(activeMedia.releaseDate).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {activeMedia.firstAirDate && (
                  <div className="flex items-center justify-between text-xs border-b border-border/20 pb-2">
                    <span className="text-muted-foreground font-bold">First Air Date</span>
                    <span className="text-white font-extrabold">
                      {new Date(activeMedia.firstAirDate).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {activeMedia.runtime !== undefined && activeMedia.runtime > 0 && (
                  <div className="flex items-center justify-between text-xs border-b border-border/20 pb-2">
                    <span className="text-muted-foreground font-bold">Duration</span>
                    <span className="text-white font-extrabold flex items-center gap-1">
                      <Clock className="size-3 text-primary" />
                      {activeMedia.runtime} mins
                    </span>
                  </div>
                )}

                {activeMedia.status && (
                  <div className="flex items-center justify-between text-xs border-b border-border/20 pb-2">
                    <span className="text-muted-foreground font-bold">Status</span>
                    <span className="text-white font-extrabold uppercase text-[10px] tracking-wider bg-white/5 px-2 py-0.5 rounded-md">
                      {activeMedia.status}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-bold">Viewer Rating</span>
                  <span className="text-amber-400 font-extrabold flex items-center gap-1">
                    <Star className="size-3.5 fill-amber-400 stroke-none" />
                    {activeMedia.voteAverage?.toFixed(1) || '0.0'} ({activeMedia.voteCount || 0}{' '}
                    reviews)
                  </span>
                </div>
              </div>
            </div>

            {/* Backdrop & Content Main panel */}
            <div className="flex-1 flex flex-col min-h-0 bg-background relative overflow-y-auto">
              {/* Immersive layered header backdrop for details */}
              <div
                className="h-64 shrink-0 relative bg-cover bg-center"
                style={{ backgroundImage: `url(${getBackdrop(activeMedia)})` }}
              >
                <div className="absolute inset-0 bg-linear-to-t from-[#0e0c0b] via-black/50 to-transparent" />

                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge className="bg-black/60 border border-white/10 text-[9px] font-black text-amber-400 gap-1 rounded-md px-1.5 py-0.5">
                      <Star className="size-2.5 fill-amber-400 stroke-none" />
                      <span>{activeMedia.voteAverage?.toFixed(1) || '0.0'}</span>
                    </Badge>
                    <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest bg-primary/20 px-2 py-0.5 rounded-md">
                      {activeMedia.contentType === 'movie' ? 'Movie' : 'TV Show'}
                    </span>
                  </div>
                  <h2 className="text-xl md:text-3xl font-black text-white italic tracking-tight uppercase leading-none truncate drop-shadow-md">
                    {activeMedia.title || activeMedia.name}
                  </h2>
                </div>
              </div>

              {/* Detail Tabs bar */}
              <div className="px-6 border-b border-border/20 bg-muted/20 shrink-0 flex gap-4">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-3.5 text-xs font-black tracking-widest uppercase cursor-pointer transition-all border-b-2 ${activeTab === 'overview' ? 'text-primary border-primary font-black' : 'text-muted-foreground/60 border-transparent hover:text-white'}`}
                >
                  Overview
                </button>
                {activeMedia.contentType === 'tv' && (
                  <button
                    onClick={() => setActiveTab('episodes')}
                    className={`py-3.5 text-xs font-black tracking-widest uppercase cursor-pointer transition-all border-b-2 ${activeTab === 'episodes' ? 'text-primary border-primary font-black' : 'text-muted-foreground/60 border-transparent hover:text-white'}`}
                  >
                    Episodes (
                    {activeMedia.numberOfEpisodes ||
                      seasons.reduce((sum, s) => sum + (s.episodeCount || 0), 0) ||
                      'Loader'}
                    )
                  </button>
                )}
              </div>

              {/* Tab Contents */}
              <div className="p-6 flex-1 min-h-0 overflow-y-auto">
                {activeTab === 'overview' ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h4 className="text-[10px] uppercase tracking-[0.2em] text-primary font-black">
                        Synopsis
                      </h4>
                      <p className="text-xs text-muted-foreground/85 leading-relaxed font-bold tracking-tight">
                        {activeMedia.overview || 'No description is available for this title yet.'}
                      </p>
                    </div>

                    {activeMedia.tagline && (
                      <div className="border-l-4 border-primary pl-4 py-1 italic text-xs text-muted-foreground/80 font-medium">
                        &ldquo;{activeMedia.tagline}&rdquo;
                      </div>
                    )}

                    {activeMedia.genres && activeMedia.genres.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] uppercase tracking-[0.2em] text-primary font-black">
                          Genres
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {activeMedia.genres.map((g) => (
                            <Badge
                              key={g}
                              className="bg-muted text-white/80 border-border/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full select-none"
                            >
                              {g}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Simulation trigger */}
                    <div className="pt-4 flex gap-4">
                      <Button
                        onClick={() => startPlayback()}
                        className="bg-primary text-primary-foreground font-black px-6 py-4.5 rounded-xl cursor-pointer hover:bg-primary/95 flex items-center gap-2 text-xs hover:scale-102 hover:shadow-lg hover:shadow-primary/20 transition-all"
                      >
                        <Play className="size-4.5 fill-current animate-pulse" />
                        <span>Watch Preview</span>
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => toggleWatchlist(activeMedia)}
                        className={`border rounded-xl px-5 py-4.5 font-bold cursor-pointer transition-all flex items-center gap-2 text-xs ${isItemInWatchlist(activeMedia) ? 'bg-primary/15 border-primary text-primary' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'}`}
                      >
                        {isItemInWatchlist(activeMedia) ? (
                          <>
                            <Check className="size-4" />
                            <span>In Watchlist</span>
                          </>
                        ) : (
                          <>
                            <Plus className="size-4" />
                            <span>Add to Watchlist</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // TV Show Season & Episodes browser
                  <div className="space-y-6">
                    {detailsError && (
                      <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-bold">
                        {detailsError}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/20 pb-4">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-black block">
                          Browse Series Seasons
                        </span>
                        <h4 className="text-sm font-black text-white">Choose a season</h4>
                      </div>

                      {loadingSeasons ? (
                        <Skeleton className="h-9 w-44 bg-muted/20" />
                      ) : (
                        <select
                          value={selectedSeasonNum || ''}
                          onChange={(e) => {
                            const num = parseInt(e.target.value)
                            setSelectedSeasonNum(num)
                            loadEpisodes(activeMedia, num)
                          }}
                          className="h-9.5 bg-muted hover:bg-muted/80 border border-border/40 hover:border-primary/20 text-white font-extrabold text-xs rounded-xl px-3 outline-hidden focus:ring-1 focus:ring-primary cursor-pointer transition-all"
                        >
                          {seasons.map((s) => (
                            <option
                              key={s.seasonNumber}
                              value={s.seasonNumber}
                              className="bg-background font-bold text-xs py-2"
                            >
                              {s.name} ({s.episodeCount || '?'} Episodes)
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {loadingEpisodes ? (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} className="h-24 w-full rounded-2xl bg-muted/15" />
                        ))}
                      </div>
                    ) : episodes.length === 0 ? (
                      <div className="py-12 text-center text-xs text-muted-foreground/60">
                        We couldn&apos;t find any episodes for this season.
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        {episodes.map((ep) => (
                          <div
                            key={ep.id}
                            className="bg-[#12100f] border border-border/40 hover:border-primary/20 p-4.5 rounded-2xl flex flex-col md:flex-row gap-4.5 items-start group/ep transition-all duration-300 hover:shadow-lg hover:shadow-primary/2"
                          >
                            <div className="aspect-video w-full md:w-44 bg-muted rounded-xl overflow-hidden shrink-0 relative border border-white/5 shadow-inner">
                              {ep.stillPath ? (
                                <img
                                  src={getImageUrl(ep.stillPath)}
                                  alt={ep.name}
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover/ep:scale-105"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="h-full w-full bg-linear-to-br from-muted/50 to-background flex items-center justify-center">
                                  <Tv className="size-6 text-muted-foreground/20" />
                                </div>
                              )}
                              <button
                                onClick={() => startPlayback(ep)}
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover/ep:opacity-100 flex items-center justify-center transition-opacity duration-300 cursor-pointer"
                              >
                                <Play className="size-6 text-primary fill-current" />
                              </button>
                              <Badge className="absolute bottom-2 left-2 bg-black/80 border border-white/10 text-[8.5px] font-black text-white tracking-widest uppercase rounded">
                                S{ep.seasonNumber.toString().padStart(2, '0')}E
                                {ep.episodeNumber.toString().padStart(2, '0')}
                              </Badge>
                            </div>

                            <div className="flex-1 space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <h5 className="font-extrabold text-xs text-white group-hover/ep:text-primary transition-colors">
                                  {ep.episodeNumber}. {ep.name}
                                </h5>
                                {ep.airDate && (
                                  <span className="text-[9px] text-muted-foreground/60 font-bold">
                                    {new Date(ep.airDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10.5px] leading-relaxed text-muted-foreground/75 font-bold tracking-tight">
                                {ep.overview || 'No description is available for this episode yet.'}
                              </p>
                              <button
                                onClick={() => startPlayback(ep)}
                                className="text-[9.5px] font-black tracking-wider uppercase text-primary hover:text-white flex items-center gap-1 cursor-pointer transition-colors mt-2"
                              >
                                <Play className="size-2.5 fill-current" />
                                <span>Watch Episode</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. IMMERSIVE GLOWING SIMULATED STREAMING MEDIA PLAYER OVERLAY */}
      {isPlaying && (
        <div className="fixed inset-0 z-50 bg-[#070505] flex items-center justify-center p-4 md:p-8 animate-in zoom-in-95 duration-200">
          <div className="w-full max-w-4xl aspect-video bg-black rounded-3xl relative overflow-hidden flex flex-col justify-end border border-white/5 shadow-2xl">
            {/* Background screen shadow mock */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-40 blur-md pointer-events-none"
              style={{ backgroundImage: `url(${getBackdrop(activeMedia || undefined)})` }}
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
                  {activeMedia?.title || activeMedia?.name}
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
