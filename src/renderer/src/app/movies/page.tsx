import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import {
  Film,
  Search,
  SlidersHorizontal,
  Star,
  Plus,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  Flame,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Play,
  Bookmark
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import type { MediaItem, MetaPagination } from '@/types'

// ─── Constants ───────────────────────────────────────────────────────────────

const API_BASE = 'https://cafeverce-api.vercel.app'
const TMDB_W500 = 'https://image.tmdb.org/t/p/w500'
const TMDB_ORIG = 'https://image.tmdb.org/t/p/original'
const PAGE_SIZE = 24

type SortKey = 'popularity' | 'voteAverage' | 'releaseDate' | 'title'
type SortOrder = 'asc' | 'desc'

const SORT_OPTIONS: { label: string; key: SortKey; order: SortOrder }[] = [
  { label: 'Most Popular', key: 'popularity', order: 'desc' },
  { label: 'Top Rated', key: 'voteAverage', order: 'desc' },
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

function GenreChip({
  label,
  active,
  onClick
}: {
  label: string
  active: boolean
  onClick: () => void
}): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all duration-200 border select-none whitespace-nowrap ${
        active
          ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20'
          : 'bg-muted/40 text-muted-foreground/70 border-border/30 hover:bg-muted hover:text-white hover:border-border/60'
      }`}
    >
      {label}
    </button>
  )
}

function SortButton({
  label,
  active,
  onClick
}: {
  label: string
  active: boolean
  onClick: () => void
}): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-[10px] font-black cursor-pointer transition-all duration-200 border select-none whitespace-nowrap ${
        active
          ? 'bg-primary/15 text-primary border-primary/30'
          : 'bg-muted/30 text-muted-foreground/60 border-border/20 hover:bg-muted/60 hover:text-white'
      }`}
    >
      {label}
    </button>
  )
}

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
  const [genres, setGenres] = useState<string[]>([])
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)

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

  // ── Search ────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<MediaItem[]>([])
  const [isSearching, setIsSearching] = useState(false)

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
        if (Array.isArray(data)) setGenres(data as string[])
        else if (data && typeof data === 'object') {
          const obj = data as Record<string, unknown>
          if (Array.isArray(obj.data)) setGenres(obj.data as string[])
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
    setLoadingMovies(true)
    setMoviesError(null)
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(PAGE_SIZE),
        sortBy: sortOption.key,
        sortOrder: sortOption.order
      })
      if (selectedGenre) params.append('genre', selectedGenre)
      const data = await fetchApi(`/movies?${params}`)
      setMovies(resolveList(data))
      setPagination(resolvePagination(data))
    } catch {
      setMoviesError('Could not load movies. Please try again.')
      setMovies([])
    } finally {
      setLoadingMovies(false)
    }
  }, [currentPage, sortOption, selectedGenre, fetchApi])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMovies()
    }, 0)
    return () => clearTimeout(timer)
  }, [loadMovies])

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1)
    }, 0)
    return () => clearTimeout(timer)
  }, [selectedGenre, sortOption])

  useEffect(() => {
    if (!searchQuery.trim()) {
      const timer = setTimeout(() => {
        setSearchResults([])
        setIsSearching(false)
      }, 0)
      return () => clearTimeout(timer)
    }
    const t = setTimeout(async () => {
      setIsSearching(true)
      try {
        const params = new URLSearchParams({
          q: searchQuery,
          type: 'movie',
          page: '1',
          limit: '12'
        })
        setSearchResults(resolveList(await fetchApi(`/search?${params}`)))
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 380)
    return () => clearTimeout(t)
  }, [searchQuery, fetchApi])

  // ── Derived ───────────────────────────────────────────────────────────────
  const spotlight = featured[featuredIdx]
  const displayMovies = searchQuery.trim() ? searchResults : movies
  const totalPages = pagination?.totalPages ?? 1

  // Suppress unused warning — getImageUrl is passed to child via context and used for backdrop
  void getImageUrl

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-full bg-background text-foreground font-sans antialiased pb-20 select-none">
      {/* ── 1. Top bar: search + sort ──────────────────────────────────────── */}
      <div className="sticky top-0 z-30 px-6 py-3.5 backdrop-blur-xl bg-background/60 border-b border-border/30 flex items-center gap-3 flex-wrap">
        <div className="flex flex-1 min-w-48 max-w-sm items-center bg-muted/40 border border-border/40 rounded-full px-3 py-1 text-xs shadow-inner focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
          <Search className="size-3.5 text-muted-foreground/50 mr-2 shrink-0" />
          <input
            type="text"
            id="movies-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search movies..."
            className="flex-1 bg-transparent border-0 outline-hidden py-1.5 text-white placeholder-muted-foreground/50 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-0.5 rounded-full bg-white/5 hover:bg-white/15 text-muted-foreground cursor-pointer transition-colors"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 ml-auto flex-wrap">
          <SlidersHorizontal className="size-3.5 text-muted-foreground/40 shrink-0" />
          <span className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest hidden sm:block">
            Sort:
          </span>
          {SORT_OPTIONS.map((opt) => (
            <SortButton
              key={opt.label}
              label={opt.label}
              active={sortOption.key === opt.key && sortOption.order === opt.order}
              onClick={() => setSortOption(opt)}
            />
          ))}
        </div>
      </div>

      {/* ── 2. Featured spotlight ─────────────────────────────────────────── */}
      {!searchQuery && spotlight && (
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

      {/* ── 3. Genre filter pills ─────────────────────────────────────────── */}
      {!searchQuery && genres.length > 0 && (
        <section className="px-6 pt-5">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <GenreChip
              label="All"
              active={selectedGenre === null}
              onClick={() => setSelectedGenre(null)}
            />
            {genres.map((g) => (
              <GenreChip
                key={g}
                label={g}
                active={selectedGenre === g}
                onClick={() => setSelectedGenre(selectedGenre === g ? null : g)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── 4. Search results header ─────────────────────────────────────── */}
      {searchQuery && (
        <section className="px-6 pt-6">
          <div className="flex items-center justify-between mb-4 border-b border-border/25 pb-3">
            <h2 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
              <Search className="size-4 text-primary" />
              Results for &ldquo;{searchQuery}&rdquo;
            </h2>
            {!isSearching && (
              <span className="text-[10px] text-muted-foreground/50 font-bold">
                {searchResults.length} found
              </span>
            )}
          </div>
        </section>
      )}

      {/* ── 5. Catalogue heading ─────────────────────────────────────────── */}
      {!searchQuery && (
        <section className="px-6 pt-6 pb-3 flex items-center justify-between">
          <h2 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            {selectedGenre ? `${selectedGenre} Movies` : 'All Movies'}
            {pagination && (
              <span className="text-[10px] text-muted-foreground/40 font-bold ml-1">
                ({pagination.totalItems?.toLocaleString()})
              </span>
            )}
          </h2>
          {selectedGenre && (
            <button
              onClick={() => setSelectedGenre(null)}
              className="text-[10px] text-muted-foreground/50 hover:text-white font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <X className="size-3" /> Clear filter
            </button>
          )}
        </section>
      )}

      {/* ── 6. Movie grid ────────────────────────────────────────────────── */}
      <section className="px-6">
        {loadingMovies || isSearching ? (
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
              <p className="text-sm font-bold text-white/50 mb-1">
                {searchQuery ? 'No movies match your search.' : 'No movies found.'}
              </p>
              <p className="text-xs text-muted-foreground/40">
                {searchQuery ? 'Try a different term.' : 'Try a different genre or sort option.'}
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
      {!searchQuery && !loadingMovies && totalPages > 1 && (
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
