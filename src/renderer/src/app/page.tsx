import React, { useState, useEffect, useCallback } from 'react'
import {
  Flame,
  Star,
  Calendar,
  Heart,
  ChevronLeft,
  ChevronRight,
  Play,
  Film,
  Bookmark,
  Tv
} from 'lucide-react'
import { MediaItem } from '@/types'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { AppContextType } from './layout'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { getImageUrl, getSlug, toggleWatchlist, isItemInWatchlist, API_BASE_URL, watchlist } =
    useOutletContext<AppContextType>()

  // API Data States
  const [featuredItems, setFeaturedItems] = useState<MediaItem[]>([])
  const [featuredIndex, setFeaturedIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Curated Lists & Categories States
  const [topRatedMovies, setTopRatedMovies] = useState<MediaItem[]>([])
  const [topRatedTv, setTopRatedTv] = useState<MediaItem[]>([])
  const [genres, setGenres] = useState<string[]>([])
  const [selectedGenre, setSelectedGenre] = useState<string>('')
  const [genreItems, setGenreItems] = useState<MediaItem[]>([])
  const [loadingGenre, setLoadingGenre] = useState(false)
  const [activeMediaTab, setActiveMediaTab] = useState<'movie' | 'tv'>('movie')

  // Fetch Featured Hero items, top rated, and unique genres when landing on dashboard
  const loadDashboardData = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      // 1. Fetch 10 recently added MOVIES ONLY to cycle through in the Billboard Hero (no mixing)
      const resRecent = await fetch(
        `${API_BASE_URL}/api/movies?limit=10&sort=created_at&order=desc`
      )

      // 2. Fetch top rated movies and TV shows separately (no mixing)
      const [resTopMovies, resTopTv] = await Promise.all([
        fetch(`${API_BASE_URL}/api/movies?limit=10&sort=vote_average&order=desc`),
        fetch(`${API_BASE_URL}/api/tvshows?limit=10&sort=vote_average&order=desc`)
      ])

      // 3. Fetch unique genres catalog list (defaults to movies)
      const resGenres = await fetch(`${API_BASE_URL}/api/movies/genres`)

      let recentData: MediaItem[] = []
      if (resRecent.ok) {
        const dataJson = await resRecent.json()
        if (dataJson.data && dataJson.data.length > 0) {
          recentData = dataJson.data.map((m: MediaItem) => ({
            ...m,
            slug: m.slug || getSlug(m.title || m.name)
          }))
        }
      }

      let topMoviesData: MediaItem[] = []
      if (resTopMovies.ok) {
        const dataJson = await resTopMovies.json()
        if (dataJson.data && dataJson.data.length > 0) {
          topMoviesData = dataJson.data.map((m: MediaItem) => ({
            ...m,
            slug: m.slug || getSlug(m.title || m.name)
          }))
        }
      }

      let topTvData: MediaItem[] = []
      if (resTopTv.ok) {
        const dataJson = await resTopTv.json()
        if (dataJson.data && dataJson.data.length > 0) {
          topTvData = dataJson.data.map((m: MediaItem) => ({
            ...m,
            slug: m.slug || getSlug(m.title || m.name)
          }))
        }
      }

      let genreList: string[] = []
      if (resGenres.ok) {
        genreList = await resGenres.json()
      }

      setFeaturedItems(recentData)
      setFeaturedIndex(0)
      setTopRatedMovies(topMoviesData)
      setTopRatedTv(topTvData)
      setGenres(genreList)
      setActiveMediaTab('movie')

      // Query initial genre items
      if (genreList.length > 0) {
        const initialGenre = genreList[0]
        setSelectedGenre(initialGenre)
        const resGenreItems = await fetch(
          `${API_BASE_URL}/api/movies?limit=9&genre=${encodeURIComponent(initialGenre)}&sort=created_at&order=desc`
        )
        if (resGenreItems.ok) {
          const dataJson = await resGenreItems.json()
          if (dataJson.data) {
            setGenreItems(
              dataJson.data.map((m: MediaItem) => ({
                ...m,
                slug: m.slug || getSlug(m.title || m.name)
              }))
            )
          }
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard highlights:', err)
      setError('Connection error or database offline.')
    } finally {
      setLoading(false)
    }
  }, [getSlug, API_BASE_URL])

  // Instant zero-motion genre active pill tab switcher
  const handleGenreChange = async (genre: string): Promise<void> => {
    setSelectedGenre(genre)
    setLoadingGenre(true)
    try {
      const resGenreItems = await fetch(
        `${API_BASE_URL}/api/${activeMediaTab === 'movie' ? 'movies' : 'tvshows'}?limit=9&genre=${encodeURIComponent(genre)}&sort=created_at&order=desc`
      )
      if (resGenreItems.ok) {
        const dataJson = await resGenreItems.json()
        if (dataJson.data) {
          setGenreItems(
            dataJson.data.map((m: MediaItem) => ({
              ...m,
              slug: m.slug || getSlug(m.title || m.name)
            }))
          )
        }
      }
    } catch (e) {
      console.error('Failed to load items for genre:', genre, e)
    } finally {
      setLoadingGenre(false)
    }
  }

  // Instantly swap media tab (Movies vs TV shows) and update the genres shelf
  const handleMediaTabChange = async (tab: 'movie' | 'tv'): Promise<void> => {
    setActiveMediaTab(tab)
    setLoadingGenre(true)
    try {
      const resGenres = await fetch(
        `${API_BASE_URL}/api/${tab === 'movie' ? 'movies' : 'tvshows'}/genres`
      )
      let genreList: string[] = []
      if (resGenres.ok) {
        genreList = await resGenres.json()
      }
      setGenres(genreList)

      if (genreList.length > 0) {
        const initialGenre = genreList[0]
        setSelectedGenre(initialGenre)
        const resGenreItems = await fetch(
          `${API_BASE_URL}/api/${tab === 'movie' ? 'movies' : 'tvshows'}?limit=9&genre=${encodeURIComponent(initialGenre)}&sort=created_at&order=desc`
        )
        if (resGenreItems.ok) {
          const dataJson = await resGenreItems.json()
          if (dataJson.data) {
            setGenreItems(
              dataJson.data.map((m: MediaItem) => ({
                ...m,
                slug: m.slug || getSlug(m.title || m.name)
              }))
            )
          }
        }
      } else {
        setGenreItems([])
        setSelectedGenre('')
      }
    } catch (e) {
      console.error('Failed to swap media tab:', tab, e)
    } finally {
      setLoadingGenre(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDashboardData()
    }, 0)
    return () => clearTimeout(timer)
  }, [loadDashboardData])

  // Auto-swap the Billboard movie every 8 seconds
  useEffect(() => {
    if (featuredItems.length <= 1) return
    const interval = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % featuredItems.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [featuredItems])

  const featuredItem = featuredItems[featuredIndex] || null

  if (loading) {
    return (
      <div className="space-y-10 select-none">
        {/* Billboard Hero Skeleton */}
        <div className="relative overflow-hidden border border-border/40 bg-muted/20 px-8 sm:px-12 flex flex-col justify-center gap-4 h-95 sm:h-112.5 lg:h-130 xl:h-145 2xl:h-162.5">
          <Skeleton className="h-5.5 w-36 bg-muted/60" />
          <Skeleton className="h-12 w-2/3 bg-muted/60 mt-1" />
          <Skeleton className="h-4.5 w-40 bg-muted/60" />
          <Skeleton className="h-16 w-full bg-muted/40 mt-1" />
          <div className="flex gap-3 mt-4">
            <Skeleton className="h-10 w-32 bg-muted/60" />
            <Skeleton className="h-10 w-32 bg-muted/60" />
          </div>
        </div>

        {/* Skeletons for shelves */}
        <div className="space-y-6 px-12">
          <Skeleton className="h-6 w-48 bg-muted/60" />
          <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-none">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-3 bg-muted/20 border border-border/30 p-3 shrink-0 w-40 sm:w-44"
              >
                <Skeleton className="aspect-2/3 w-full bg-muted/50" />
                <Skeleton className="h-4.5 w-4/5 bg-muted/50" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6 px-12">
          <Skeleton className="h-6 w-48 bg-muted/60" />
          <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-none">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-3 bg-muted/20 border border-border/30 p-3 shrink-0 w-40 sm:w-44"
              >
                <Skeleton className="aspect-2/3 w-full bg-muted/50" />
                <Skeleton className="h-4.5 w-4/5 bg-muted/50" />
              </div>
            ))}
          </div>
        </div>

        {/* Curated Genres Grid Skeleton */}
        <div className="space-y-6 px-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <Skeleton className="h-6 w-48 bg-muted/60" />
              <Skeleton className="h-3.5 w-64 bg-muted/40" />
            </div>
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={idx} className="h-7.5 w-16 bg-muted/50 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-3 bg-muted/20 border border-border/30 p-3"
              >
                <Skeleton className="aspect-2/3 w-full bg-muted/50" />
                <Skeleton className="h-4.5 w-4/5 bg-muted/50" />
                <Skeleton className="h-3.5 w-1/2 bg-muted/30" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center border border-border/50 bg-muted/20 max-w-lg mx-auto select-none">
        <div className="relative flex h-14 w-14 items-center justify-center bg-muted/80 border border-border/10 mb-4">
          <Film className="size-6 text-destructive" />
        </div>
        <h4 className="text-md font-black text-white uppercase tracking-wider mb-2">
          Unable to Load Highlights
        </h4>
        <p className="text-xs text-muted-foreground/75 leading-relaxed max-w-sm mb-6 font-medium">
          {error} Verify that your CaféVerse API backend services are running properly.
        </p>
        <button
          onClick={loadDashboardData}
          className="h-9 px-5 bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider hover:bg-primary/95 transition-all cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {/* Hero Billboard Section */}
      {featuredItem && (
        <div className="relative overflow-hidden border border-border bg-muted/40 select-none group/billboard h-95 sm:h-112.5 lg:h-130 xl:h-145 2xl:h-162.5 flex flex-col justify-center">
          <div className="absolute inset-0 z-0 transition-all duration-700 ease-in-out">
            <img
              key={featuredItem.id}
              src={getImageUrl(featuredItem.backdropPath)}
              alt={featuredItem.title || featuredItem.name}
              className="h-full w-full object-cover opacity-50 animate-fade-in"
            />
          </div>

          <div className="relative z-20 max-w-2xl px-8 sm:px-12 flex flex-col items-start gap-4">
            <div className="flex items-center gap-2.5 rounded-full bg-primary/10 px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary border border-primary/20">
              <Flame className="size-3 text-destructive" />
              <span>RECENTLY ADDED</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-white uppercase italic leading-none line-clamp-2">
              {featuredItem.title || featuredItem.name}
            </h2>

            {featuredItem.tagline && (
              <p className="text-xs font-black italic text-primary tracking-wider uppercase">
                &ldquo;{featuredItem.tagline}&rdquo;
              </p>
            )}

            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 font-medium max-w-[65ch]">
              {featuredItem.overview}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-muted-foreground mt-2">
              <span className="flex items-center gap-1.5 bg-muted/70 border border-border px-2.5 py-1 rounded-lg text-primary">
                <Star className="size-3 fill-primary text-primary" />{' '}
                {featuredItem.voteAverage?.toFixed(1) || 'N/A'} Score
              </span>
              {featuredItem.releaseDate && (
                <span className="flex items-center gap-1.5 bg-muted/50 border border-border px-2.5 py-1 rounded-lg">
                  <Calendar className="size-3" /> {new Date(featuredItem.releaseDate).getFullYear()}
                </span>
              )}
              {featuredItem.genres &&
                featuredItem.genres.slice(0, 3).map((g) => (
                  <span
                    key={g}
                    className="bg-primary/10 border border-primary/15 text-primary px-2.5 py-1 rounded-lg"
                  >
                    {g}
                  </span>
                ))}
            </div>

            <div className="flex items-center gap-4 mt-6">
              <button
                onClick={() =>
                  navigate(
                    '/movies/' +
                      (featuredItem.slug || getSlug(featuredItem.title || featuredItem.name))
                  )
                }
                className="flex items-center gap-2 h-10 rounded-xl bg-primary px-6 text-xs font-black uppercase tracking-wider text-primary-foreground hover:bg-primary/95 cursor-pointer shadow-md"
              >
                <Play className="size-3.5 fill-primary-foreground" />
                <span>Watch Now</span>
              </button>

              <button
                onClick={() => toggleWatchlist(featuredItem)}
                className={`flex items-center gap-2 h-10 rounded-xl px-5 text-xs font-black uppercase tracking-wider cursor-pointer ${
                  isItemInWatchlist(featuredItem)
                    ? 'bg-destructive/20 text-destructive hover:bg-destructive/30'
                    : 'bg-muted/40 text-foreground hover:bg-muted'
                }`}
              >
                <Heart
                  className={`size-3.5 ${
                    isItemInWatchlist(featuredItem)
                      ? 'fill-destructive text-destructive'
                      : 'text-muted-foreground/50'
                  }`}
                />
                <span>{isItemInWatchlist(featuredItem) ? 'Watchlisted' : 'Add Watchlist'}</span>
              </button>
            </div>
          </div>

          {featuredItems.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setFeaturedIndex(
                    (prev) => (prev - 1 + featuredItems.length) % featuredItems.length
                  )
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-xl text-white cursor-pointer hidden md:flex items-center justify-center"
                title="Previous Highlight"
              >
                <ChevronLeft className="size-5" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setFeaturedIndex((prev) => (prev + 1) % featuredItems.length)
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-xl text-white cursor-pointer hidden md:flex items-center justify-center"
                title="Next Highlight"
              >
                <ChevronRight className="size-5" />
              </button>

              <div className="absolute bottom-4 right-8 z-30 flex items-center gap-1.5">
                {featuredItems.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation()
                      setFeaturedIndex(idx)
                    }}
                    className={`h-1.5 transition-all duration-300 rounded-full cursor-pointer ${
                      idx === featuredIndex
                        ? 'w-5 bg-primary'
                        : 'w-1.5 bg-white/30 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* PERSONALIZED WATCHLIST CAROUSEL */}
      {watchlist && watchlist.length > 0 && (
        <div className="space-y-6 px-12 select-none">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-black tracking-widest text-white/95 uppercase flex items-center gap-2">
              <Bookmark className="text-primary size-4.5 fill-primary/10" /> My Library Watchlist
            </h3>
            <button
              onClick={() => navigate('/watchlist')}
              className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors cursor-pointer"
            >
              View Full Watchlist <ChevronRight className="size-3.5" />
            </button>
          </div>

          <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory">
            {watchlist.map((item) => (
              <div
                key={item.id}
                onClick={() =>
                  navigate(
                    (item.contentType === 'tv' ? '/tvshows/' : '/movies/') +
                      (item.slug || getSlug(item.title || item.name))
                  )
                }
                className="group flex flex-col gap-3 bg-muted/30 border border-border/40 p-3 hover:bg-muted/60 transition-all duration-150 cursor-pointer rounded-xl shrink-0 w-40 sm:w-44 snap-start"
              >
                <div className="relative aspect-2/3 overflow-hidden rounded-lg bg-card">
                  <img
                    src={getImageUrl(item.posterPath)}
                    alt={item.title || item.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-2 right-2 flex h-5 items-center gap-0.5 rounded-md bg-card/95 px-1.5 text-[9px] font-black text-primary border border-border/80 backdrop-blur-md">
                    <Star className="size-2.5 fill-primary text-primary" />
                    {item.voteAverage?.toFixed(1) || 'N/A'}
                  </div>
                </div>
                <div className="px-1 min-w-0">
                  <h4 className="text-xs font-black text-white truncate group-hover:text-primary transition-colors uppercase tracking-wide">
                    {item.title || item.name}
                  </h4>
                  <div className="flex items-center justify-between text-[9px] text-muted-foreground/60 font-semibold mt-0.5">
                    <span>
                      {item.releaseDate
                        ? new Date(item.releaseDate).getFullYear()
                        : item.firstAirDate
                          ? new Date(item.firstAirDate).getFullYear()
                          : 'Series'}
                    </span>
                    <span className="uppercase text-primary font-black">{item.contentType}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOP RATED MOVIES CAROUSEL */}
      {topRatedMovies && topRatedMovies.length > 0 && (
        <div className="space-y-6 px-12 select-none">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-black tracking-widest text-white/95 uppercase flex items-center gap-2">
              <Film className="text-primary size-4.5" /> Top Rated Movies
            </h3>
            <button
              onClick={() => navigate('/movies?sort=vote_average&order=desc')}
              className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors cursor-pointer"
            >
              View All Movies <ChevronRight className="size-3.5" />
            </button>
          </div>

          <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory">
            {topRatedMovies.map((item) => (
              <div
                key={item.id}
                onClick={() =>
                  navigate('/movies/' + (item.slug || getSlug(item.title || item.name)))
                }
                className="group flex flex-col gap-3 bg-muted/30 border border-border/40 p-3 hover:bg-muted/60 transition-all duration-150 cursor-pointer rounded-xl shrink-0 w-40 sm:w-44 snap-start"
              >
                <div className="relative aspect-2/3 overflow-hidden rounded-lg bg-card">
                  <img
                    src={getImageUrl(item.posterPath)}
                    alt={item.title || item.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-2 right-2 flex h-5 items-center gap-0.5 rounded-md bg-card/95 px-1.5 text-[9px] font-black text-primary border border-border/80 backdrop-blur-md">
                    <Star className="size-2.5 fill-primary text-primary" />
                    {item.voteAverage?.toFixed(1) || 'N/A'}
                  </div>
                </div>
                <div className="px-1 min-w-0">
                  <h4 className="text-xs font-black text-white truncate group-hover:text-primary transition-colors uppercase tracking-wide">
                    {item.title || item.name}
                  </h4>
                  <div className="flex items-center justify-between text-[9px] text-muted-foreground/60 font-semibold mt-0.5">
                    <span>
                      {item.releaseDate ? new Date(item.releaseDate).getFullYear() : 'N/A'}
                    </span>
                    <span className="uppercase text-primary font-black">{item.contentType}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOP RATED TV SERIES CAROUSEL */}
      {topRatedTv && topRatedTv.length > 0 && (
        <div className="space-y-6 px-12 select-none">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-black tracking-widest text-white/95 uppercase flex items-center gap-2">
              <Tv className="text-primary size-4.5" /> Top Rated TV Series
            </h3>
            <button
              onClick={() => navigate('/tvshows?sort=vote_average&order=desc')}
              className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors cursor-pointer"
            >
              View All TV Series <ChevronRight className="size-3.5" />
            </button>
          </div>

          <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory">
            {topRatedTv.map((item) => (
              <div
                key={item.id}
                onClick={() =>
                  navigate('/tvshows/' + (item.slug || getSlug(item.title || item.name)))
                }
                className="group flex flex-col gap-3 bg-muted/30 border border-border/40 p-3 hover:bg-muted/60 transition-all duration-150 cursor-pointer rounded-xl shrink-0 w-40 sm:w-44 snap-start"
              >
                <div className="relative aspect-2/3 overflow-hidden rounded-lg bg-card">
                  <img
                    src={getImageUrl(item.posterPath)}
                    alt={item.title || item.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-2 right-2 flex h-5 items-center gap-0.5 rounded-md bg-card/95 px-1.5 text-[9px] font-black text-primary border border-border/80 backdrop-blur-md">
                    <Star className="size-2.5 fill-primary text-primary" />
                    {item.voteAverage?.toFixed(1) || 'N/A'}
                  </div>
                </div>
                <div className="px-1 min-w-0">
                  <h4 className="text-xs font-black text-white truncate group-hover:text-primary transition-colors uppercase tracking-wide">
                    {item.title || item.name}
                  </h4>
                  <div className="flex items-center justify-between text-[9px] text-muted-foreground/60 font-semibold mt-0.5">
                    <span>
                      {item.firstAirDate ? new Date(item.firstAirDate).getFullYear() : 'Series'}
                    </span>
                    <span className="uppercase text-primary font-black">{item.contentType}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DYNAMIC CURATED GENRES SHELF */}
      <div className="space-y-6 px-12 pb-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="space-y-1">
              <h3 className="text-md font-black tracking-widest text-white/95 uppercase flex items-center gap-2 select-none">
                <Film className="text-primary size-4.5" /> Curated Catalog
              </h3>
              <p className="text-[10px] text-muted-foreground/60 font-semibold tracking-tight uppercase">
                Browse dynamic title spotlights by popular categories
              </p>
            </div>

            {/* Media Type Segmented Toggle */}
            <div className="flex items-center bg-muted/40 border border-border/40 p-0.5 rounded-xl self-start select-none">
              <button
                type="button"
                onClick={() => handleMediaTabChange('movie')}
                className={`px-3.5 py-1.5 text-[9px] font-black tracking-wider uppercase rounded-lg transition-all cursor-pointer ${
                  activeMediaTab === 'movie'
                    ? 'bg-primary text-primary-foreground font-black shadow-md'
                    : 'text-muted-foreground/70 hover:text-foreground'
                }`}
              >
                Movies
              </button>
              <button
                type="button"
                onClick={() => handleMediaTabChange('tv')}
                className={`px-3.5 py-1.5 text-[9px] font-black tracking-wider uppercase rounded-lg transition-all cursor-pointer ${
                  activeMediaTab === 'tv'
                    ? 'bg-primary text-primary-foreground font-black shadow-md'
                    : 'text-muted-foreground/70 hover:text-foreground'
                }`}
              >
                TV Series
              </button>
            </div>
          </div>

          {/* Genre Tab Selector pills */}
          {genres && genres.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none max-w-full">
              {genres.slice(0, 10).map((genre) => (
                <button
                  key={genre}
                  onClick={() => handleGenreChange(genre)}
                  className={`px-3 py-1.5 text-[9px] font-black tracking-wider uppercase rounded-xl border transition-all cursor-pointer select-none shrink-0 ${
                    selectedGenre === genre
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/30 text-muted-foreground border-border/40 hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic Asymmetric Content Container */}
        <div
          className={`grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 transition-opacity duration-150 ${loadingGenre ? 'opacity-40' : 'opacity-100'}`}
        >
          {genreItems.length > 0 ? (
            genreItems.map((item, index) => {
              if (index === 0) {
                // Large spotlight presentation of active genre's first movie
                return (
                  <div
                    key={item.id}
                    onClick={() =>
                      navigate(
                        (item.contentType === 'tv' ? '/tvshows/' : '/movies/') +
                          (item.slug || getSlug(item.title || item.name))
                      )
                    }
                    className="col-span-2 group flex gap-5 bg-card/60 border border-border/40 p-4 hover:bg-card/90 hover:border-primary/20 transition-all duration-150 cursor-pointer h-full rounded-xl"
                  >
                    <div className="relative aspect-2/3 h-full overflow-hidden rounded-lg shrink-0 w-28 sm:w-32 bg-muted/30">
                      <img
                        src={getImageUrl(item.posterPath)}
                        alt={item.title || item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col justify-between py-1 flex-1 min-w-0">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="uppercase tracking-widest text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/15">
                            Spotlight
                          </span>
                          <div className="flex items-center gap-0.5 text-[10px] font-black text-primary bg-muted/60 px-1.5 py-0.5 rounded-md border border-border/30">
                            <Star className="size-3 fill-primary text-primary" />
                            {item.voteAverage?.toFixed(1) || 'N/A'}
                          </div>
                        </div>
                        <h4 className="text-sm font-black text-white group-hover:text-primary transition-colors uppercase tracking-wide truncate">
                          {item.title || item.name}
                        </h4>
                        <p className="text-xs text-muted-foreground/80 leading-relaxed font-medium line-clamp-3 sm:line-clamp-4">
                          {item.overview}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground/60 font-semibold mt-2 border-t border-border/20 pt-2">
                        <span>
                          Released:{' '}
                          {item.releaseDate
                            ? new Date(item.releaseDate).getFullYear()
                            : item.firstAirDate
                              ? new Date(item.firstAirDate).getFullYear()
                              : 'N/A'}
                        </span>
                        <span className="uppercase text-primary font-black tracking-wider">
                          {item.contentType}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              }

              // Standard content card
              return (
                <div
                  key={item.id}
                  onClick={() =>
                    navigate(
                      (item.contentType === 'tv' ? '/tvshows/' : '/movies/') +
                        (item.slug || getSlug(item.title || item.name))
                    )
                  }
                  className="group flex flex-col gap-3 bg-muted/40 border border-border/50 p-3 hover:bg-muted/80 transition-all duration-150 cursor-pointer rounded-xl"
                >
                  <div className="relative aspect-2/3 overflow-hidden bg-card rounded-lg">
                    <img
                      src={getImageUrl(item.posterPath)}
                      alt={item.title || item.name}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-2.5 right-2.5 flex h-6 items-center gap-0.5 rounded-lg bg-card/90 px-2 text-[10px] font-black text-primary border border-border backdrop-blur-md">
                      <Star className="size-3 fill-primary text-primary" />
                      {item.voteAverage?.toFixed(1) || 'N/A'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 px-1">
                    <h4 className="text-xs font-black text-white truncate group-hover:text-primary transition-colors uppercase tracking-wide">
                      {item.title || item.name}
                    </h4>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground/60 font-semibold">
                      <span>
                        {item.releaseDate
                          ? new Date(item.releaseDate).getFullYear()
                          : item.firstAirDate
                            ? new Date(item.firstAirDate).getFullYear()
                            : 'Series'}
                      </span>
                      <span className="uppercase tracking-widest text-[9px] font-black text-primary">
                        {item.contentType}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-16 px-6 text-center rounded-2xl border border-dashed border-border bg-muted/20 max-w-lg mx-auto">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-muted/80 border border-border/10 mb-4">
                <Film className="size-6 text-primary" />
              </div>
              <h4 className="text-md font-black text-white uppercase tracking-wider mb-2">
                No Titles in Database
              </h4>
              <p className="text-xs text-muted-foreground/75 leading-relaxed max-w-sm font-medium">
                No movies or television shows have been catalogued under the active genre.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
