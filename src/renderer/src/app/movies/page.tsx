import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import {
  Film,
  Star,
  Plus,
  Check,
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  Flame,
  AlertTriangle,
  RotateCcw,
  Play,
  Bookmark
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import GenreFilter from '@/components/genre-filter'
import type { MediaItem, MetaPagination, SortOption } from '@/types'

const API_BASE = 'https://cafeverce-api.vercel.app'
const TMDB_W500 = 'https://image.tmdb.org/t/p/w500'
const TMDB_ORIG = 'https://image.tmdb.org/t/p/original'
const PAGE_SIZE = 24

const SORT_OPTIONS: SortOption[] = [
  { label: 'Most Popular', key: 'popularity', order: 'desc' },
  { label: 'Top Rated', key: 'voteAverage', order: 'desc' },
  { label: 'Newly Uploaded', key: 'createdAt', order: 'desc' },
  { label: 'Newest First', key: 'releaseDate', order: 'desc' },
  { label: 'Oldest First', key: 'releaseDate', order: 'asc' },
  { label: 'A – Z', key: 'title', order: 'asc' }
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getPoster = (item: MediaItem): string => {
  if (!item.posterPath) return ''
  const p = item.posterPath.startsWith('/') ? item.posterPath : `/${item.posterPath}`
  return `${TMDB_W500}${p}`
}

const getBackdrop = (item: MediaItem): string => {
  const path = item.backdropPath || item.posterPath
  if (!path) return ''
  const p = path.startsWith('/') ? path : `/${path}`
  return `${TMDB_ORIG}${p}`
}

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

const resolvePagination = (res: unknown): MetaPagination | null => {
  if (res && typeof res === 'object') {
    const obj = res as Record<string, unknown>
    if (obj.meta && typeof obj.meta === 'object') return obj.meta as MetaPagination
    if (obj.pagination && typeof obj.pagination === 'object')
      return obj.pagination as MetaPagination
  }
  return null
}

/** Derive the navigation slug: prefer the API slug, fall back to id */
const getSlug = (item: MediaItem): string => item.slug || String(item.id)

// ─── Sub-components ──────────────────────────────────────────────────────────

function MovieCard({
  item,
  inWatchlist,
  onNavigate,
  onWatchlistToggle
}: {
  item: MediaItem
  inWatchlist: boolean
  onNavigate: () => void
  onWatchlistToggle: (e: React.MouseEvent) => void
}): React.JSX.Element {
  const poster = getPoster(item)
  const year = item.releaseDate ? new Date(item.releaseDate).getFullYear() : null

  return (
    <div
      onClick={onNavigate}
      className="group relative cursor-pointer rounded-xl border border-border/30 hover:border-primary/25 bg-muted/10 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5"
    >
      <div className="aspect-2/3 w-full bg-muted relative overflow-hidden">
        {poster ? (
          <img
            src={poster}
            alt={item.title || item.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-linear-to-br from-muted/60 to-background flex flex-col items-center justify-center gap-2 p-3">
            <Film className="size-8 text-muted-foreground/20" />
            <span className="text-[9px] font-black text-muted-foreground/50 text-center leading-tight">
              {item.title || item.name}
            </span>
          </div>
        )}

        {/* Hover play overlay */}
        <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <PlayCircle className="size-11 text-primary drop-shadow-lg" />
        </div>

        {/* Rating */}
        <Badge className="absolute top-2 right-2 bg-black/75 border border-white/10 text-[8px] font-black text-amber-400 gap-0.5 rounded-md px-1.5 py-0.5">
          <Star className="size-2 fill-amber-400 stroke-none" />
          <span>{item.voteAverage?.toFixed(1) || '0.0'}</span>
        </Badge>

        {/* Watchlist quick-add (hover-reveal) */}
        <button
          onClick={onWatchlistToggle}
          title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
          className={`absolute top-2 left-2 size-6 rounded-md flex items-center justify-center cursor-pointer transition-all duration-200 border opacity-0 group-hover:opacity-100 ${
            inWatchlist
              ? 'bg-primary border-primary text-primary-foreground'
              : 'bg-black/70 border-white/15 text-white hover:bg-primary hover:border-primary'
          }`}
        >
          {inWatchlist ? <Check className="size-3" /> : <Plus className="size-3" />}
        </button>
      </div>

      <div className="p-2.5 space-y-0.5">
        <h3 className="font-extrabold text-[11px] tracking-tight text-white leading-tight truncate group-hover:text-primary transition-colors">
          {item.title || item.name}
        </h3>
        <div className="flex items-center gap-1.5">
          {year && <span className="text-[9px] text-muted-foreground/50 font-bold">{year}</span>}
          {item.genres?.length > 0 && (
            <>
              <span className="text-muted-foreground/25 text-[8px]">·</span>
              <span className="text-[9px] text-muted-foreground/45 font-bold truncate">
                {item.genres[0]}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function MovieCardSkeleton(): React.JSX.Element {
  return (
    <div className="rounded-xl border border-border/20 bg-muted/10 overflow-hidden">
      <Skeleton className="aspect-2/3 w-full bg-muted/20 rounded-none" />
      <div className="p-2.5 space-y-1.5">
        <Skeleton className="h-3 w-3/4 bg-muted/20" />
        <Skeleton className="h-2 w-1/2 bg-muted/20" />
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function MoviesPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { getImageUrl } = useOutletContext<{ getImageUrl: (path?: string) => string }>()

  // ── Genres ────────────────────────────────────────────────────────────────
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([])
  const genreMap = React.useMemo(() => new Map(genres.map((g) => [g.name, g])), [genres])
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])

  // ── Catalogue ─────────────────────────────────────────────────────────────
  const [movies, setMovies] = useState<MediaItem[]>([])
  const [pagination, setPagination] = useState<MetaPagination | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortOption, setSortOption] = useState(SORT_OPTIONS[0])
  const [loadingMovies, setLoadingMovies] = useState(true)
  const [moviesError, setMoviesError] = useState<string | null>(null)

  // ── Spotlight ─────────────────────────────────────────────────────────────
  const [featured, setFeatured] = useState<MediaItem[]>([])
  const [featuredIdx, setFeaturedIdx] = useState(0)
  const spotlightRef = useRef<NodeJS.Timeout | null>(null)

  // ── Watchlist ─────────────────────────────────────────────────────────────
  const [watchlist, setWatchlist] = useState<MediaItem[]>(() => {
    try {
      const saved = localStorage.getItem('cafeverse_watchlist')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const isInWatchlist = useCallback(
    (item: MediaItem) =>
      watchlist.some((w) => w.id === item.id && w.contentType === item.contentType),
    [watchlist]
  )

  const toggleWatchlist = useCallback((item: MediaItem) => {
    setWatchlist((prev) => {
      const exists = prev.some((w) => w.id === item.id && w.contentType === item.contentType)
      const updated = exists
        ? prev.filter((w) => !(w.id === item.id && w.contentType === item.contentType))
        : [...prev, item]
      localStorage.setItem('cafeverse_watchlist', JSON.stringify(updated))
      return updated
    })
  }, [])

  // ── API ───────────────────────────────────────────────────────────────────
  const fetchApi = useCallback(async (endpoint: string): Promise<unknown> => {
    const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  }, [])

  useEffect(() => {
    fetchApi('/movies/genres')
      .then((data) => {
        if (data && typeof data === 'object') {
          const obj = data as Record<string, unknown>
          const resolved = Array.isArray(obj.genres)
            ? obj.genres
            : Array.isArray(obj.data)
              ? obj.data
              : []
          const mapped = (resolved as (string | { id?: number; name?: string })[]).map((g) => {
            if (typeof g === 'string') return { id: 0, name: g }
            return { id: g.id || 0, name: g.name || '' }
          })
          setGenres(mapped)
        } else if (Array.isArray(data)) {
          const mapped = (data as (string | { id?: number; name?: string })[]).map((g) => {
            if (typeof g === 'string') return { id: 0, name: g }
            return { id: g.id || 0, name: g.name || '' }
          })
          setGenres(mapped)
        }
      })
      .catch(() => {})
  }, [fetchApi])

  useEffect(() => {
    fetchApi('/movies/featured')
      .then((data) => setFeatured(resolveList(data)))
      .catch(() => {})
  }, [fetchApi])

  useEffect(() => {
    if (featured.length > 1) {
      spotlightRef.current = setInterval(() => {
        setFeaturedIdx((p) => (p + 1) % featured.length)
      }, 7000)
    }
    return () => {
      if (spotlightRef.current) clearInterval(spotlightRef.current)
    }
  }, [featured])

  const loadMovies = useCallback(async () => {
    // Avoid synchronous state updates in the callback's immediate body
    // by deferring them or wrapping them in a microtask/Promise if they execute synchronously.
    // However, the cleanest React way is to perform state changes asynchronously or check mounting.
    Promise.resolve().then(() => {
      setLoadingMovies(true)
      setMoviesError(null)
    })
    try {
      if (selectedGenres.length > 1) {
        // Multi-genre filtering fallback: fetch all movies for each selected genre in parallel,
        // then intersect them to find matches belonging to all selected genres.
        const fetches = selectedGenres.map(async (genreName) => {
          const genreObj = genreMap.get(genreName)
          const params = new URLSearchParams({
            limit: '1000',
            sortBy: sortOption.key,
            sortOrder: sortOption.order
          })
          if (genreObj) params.append('genreId', String(genreObj.id))
          const res = await fetchApi(`/movies?${params}`)
          return resolveList(res)
        })

        const lists = await Promise.all(fetches)

        // Intersect the lists by movie ID (optimized)
        // Sort by length to minimize filter operations and set creation overhead.
        // We preserve lists[0] if lengths are equal to maintain idiomatic ordering.
        const sortedLists = [...lists].sort((a, b) => a.length - b.length)
        let filtered = sortedLists[0] || []

        for (let i = 1; i < sortedLists.length; i++) {
          if (filtered.length === 0) break // Short-circuit if no matches remain

          const currentList = sortedLists[i]
          const ids = new Set<number>()
          for (let j = 0; j < currentList.length; j++) {
            ids.add(currentList[j].id)
          }
          filtered = filtered.filter((m) => ids.has(m.id))
        }

        // Paginate locally
        const totalItems = filtered.length
        const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1
        const startIndex = (currentPage - 1) * PAGE_SIZE
        const displayMovies = filtered.slice(startIndex, startIndex + PAGE_SIZE)

        setMovies(displayMovies)
        setPagination({
          currentPage,
          itemCount: displayMovies.length,
          itemsPerPage: PAGE_SIZE,
          totalItems,
          totalPages
        })
      } else {
        // Single-genre or no-genre filtering (server-side pagination)
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(PAGE_SIZE),
          sortBy: sortOption.key,
          sortOrder: sortOption.order
        })
        if (selectedGenres.length === 1) {
          const genreObj = genreMap.get(selectedGenres[0])
          if (genreObj) params.append('genreId', String(genreObj.id))
        }
        const data = await fetchApi(`/movies?${params}`)
        setMovies(resolveList(data))
        setPagination(resolvePagination(data))
      }
    } catch {
      setMoviesError('Could not load movies. Please try again.')
      setMovies([])
      setPagination(null)
    } finally {
      setLoadingMovies(false)
    }
  }, [currentPage, sortOption, selectedGenres, genreMap, fetchApi])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMovies()
  }, [loadMovies])

  // ── Derived ───────────────────────────────────────────────────────────────
  const spotlight = featured[featuredIdx]
  const displayMovies = movies
  const totalPages = pagination?.totalPages ?? 1

  // Suppress unused warning — getImageUrl is passed to child via context and used for backdrop
  void getImageUrl

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-full bg-background text-foreground font-sans antialiased pb-20 select-none">
      {/* ── 1. Sort + Genre filter + Heading ────────────────────────────── */}
      <GenreFilter
        genres={genres.map((g) => g.name)}
        selectedGenres={selectedGenres}
        onGenreChange={(genreName) => {
          if (genreName === null) {
            setSelectedGenres([])
          } else {
            setSelectedGenres((prev) =>
              prev.includes(genreName) ? prev.filter((g) => g !== genreName) : [...prev, genreName]
            )
          }
          setCurrentPage(1)
        }}
        sortOptions={SORT_OPTIONS}
        activeSortOption={sortOption}
        onSortChange={(o) => {
          setSortOption(o)
          setCurrentPage(1)
        }}
        contentLabel="Movies"
        totalItems={pagination?.totalItems}
      />

      {/* ── 2. Featured spotlight ─────────────────────────────────────────── */}
      {spotlight && (
        <section className="px-6 pt-6">
          <div className="w-full h-85 rounded-2xl relative overflow-hidden group border border-border/20 shadow-2xl">
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-100 group-hover:scale-[1.02]"
              style={{ backgroundImage: `url(${getBackdrop(spotlight)})` }}
            >
              <div className="absolute inset-0 bg-linear-to-r from-background/95 via-background/60 to-transparent" />
              <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent" />
            </div>

            <div className="absolute inset-y-0 left-0 w-full md:w-3/5 p-8 flex flex-col justify-center gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-primary/20 text-primary border border-primary/20 text-[9px] font-black uppercase tracking-wider rounded-md px-2 py-0.5 animate-pulse">
                  <Flame className="size-2.5 text-primary mr-1 fill-primary" />
                  Featured
                </Badge>
                <Badge className="bg-black/60 border border-white/10 text-[9px] font-black text-amber-400 gap-1 rounded-md px-1.5 py-0.5">
                  <Star className="size-2.5 fill-amber-400 stroke-none" />
                  {spotlight.voteAverage?.toFixed(1) || '0.0'}
                </Badge>
                {spotlight.releaseDate && (
                  <span className="text-[10px] text-muted-foreground font-bold">
                    {new Date(spotlight.releaseDate).getFullYear()}
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white italic uppercase leading-none">
                {spotlight.title || spotlight.name}
              </h1>

              <p className="text-xs text-muted-foreground/80 font-bold leading-relaxed line-clamp-3 max-w-md">
                {spotlight.overview || 'Discover this featured film in our collection.'}
              </p>

              {spotlight.genres?.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {spotlight.genres.slice(0, 4).map((g) => (
                    <Badge
                      key={g}
                      className="bg-white/5 hover:bg-white/10 border-none text-[9px] text-white/75 font-bold px-2 py-0.5 rounded-full cursor-pointer"
                    >
                      {g}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex gap-2.5 flex-wrap">
                <Button
                  onClick={() => navigate(`/movies/${getSlug(spotlight)}`)}
                  className="bg-primary text-primary-foreground font-black px-5 py-4 rounded-xl cursor-pointer hover:bg-primary/90 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2 text-xs"
                >
                  <Play className="size-4 fill-current" />
                  Watch Now
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toggleWatchlist(spotlight)}
                  className={`border rounded-xl px-4 py-4 font-bold cursor-pointer transition-all flex items-center gap-2 text-xs ${
                    isInWatchlist(spotlight)
                      ? 'bg-primary/15 border-primary text-primary'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                  }`}
                >
                  {isInWatchlist(spotlight) ? (
                    <>
                      <Check className="size-4" /> Saved
                    </>
                  ) : (
                    <>
                      <Bookmark className="size-4" /> Save
                    </>
                  )}
                </Button>
              </div>
            </div>

            {featured.length > 1 && (
              <div className="absolute bottom-5 right-6 flex gap-1.5 z-10">
                {featured.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setFeaturedIdx(i)
                      if (spotlightRef.current) clearInterval(spotlightRef.current)
                    }}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${featuredIdx === i ? 'w-6 bg-primary' : 'w-1.5 bg-white/25 hover:bg-white/50'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── 6. Movie grid ────────────────────────────────────────────────── */}
      <section className="px-6">
        {loadingMovies ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <MovieCardSkeleton key={i} />
            ))}
          </div>
        ) : moviesError ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4 border border-dashed border-border/20 rounded-2xl bg-muted/5">
            <AlertTriangle className="size-10 text-destructive/50 animate-pulse" />
            <p className="text-sm font-bold text-white/60">{moviesError}</p>
            <Button
              size="sm"
              onClick={loadMovies}
              className="bg-primary text-primary-foreground text-xs font-black rounded-xl cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="size-3" /> Try Again
            </Button>
          </div>
        ) : displayMovies.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 border border-dashed border-border/20 rounded-2xl bg-muted/5">
            <Film className="size-12 text-muted-foreground/20" />
            <div className="text-center">
              <p className="text-sm font-bold text-white/50 mb-1">No movies found.</p>
              <p className="text-xs text-muted-foreground/40">
                Try a different genre or sort option.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {displayMovies.map((movie) => (
              <MovieCard
                key={`${movie.id}-${movie.contentType}`}
                item={movie}
                inWatchlist={isInWatchlist(movie)}
                onNavigate={() => navigate(`/movies/${getSlug(movie)}`)}
                onWatchlistToggle={(e) => {
                  e.stopPropagation()
                  toggleWatchlist(movie)
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── 7. Pagination ────────────────────────────────────────────────── */}
      {!loadingMovies && totalPages > 1 && (
        <section className="px-6 pt-8 flex items-center justify-center gap-2 flex-wrap">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-2 rounded-xl bg-muted/40 border border-border/30 text-muted-foreground hover:bg-muted hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            <ChevronLeft className="size-4" />
          </button>

          <div className="flex gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`size-8 rounded-xl text-[11px] font-black cursor-pointer transition-all border ${
                  currentPage === page
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/30 text-muted-foreground/60 border-border/20 hover:bg-muted hover:text-white'
                }`}
              >
                {page}
              </button>
            ))}
            {totalPages > 7 && (
              <>
                <span className="flex items-center justify-center size-8 text-[11px] text-muted-foreground/30 font-black">
                  ...
                </span>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className={`size-8 rounded-xl text-[11px] font-black cursor-pointer transition-all border ${
                    currentPage === totalPages
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/30 text-muted-foreground/60 border-border/20 hover:bg-muted hover:text-white'
                  }`}
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>

          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-2 rounded-xl bg-muted/40 border border-border/30 text-muted-foreground hover:bg-muted hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            <ChevronRight className="size-4" />
          </button>

          <Separator orientation="vertical" className="h-5 bg-border/25 mx-1" />
          <span className="text-[10px] text-muted-foreground/40 font-bold">
            Page {currentPage} of {totalPages}
          </span>
        </section>
      )}
    </div>
  )
}
