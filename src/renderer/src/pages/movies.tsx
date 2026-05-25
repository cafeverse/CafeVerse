import React, { useState, useEffect } from 'react'
import { Search, X, Loader2, Star, ChevronLeft, ChevronRight, Film } from 'lucide-react'
import { MediaItem, MetaPagination } from '@/types'
import { useNavigate } from 'react-router-dom'

interface MoviesProps {
  API_BASE_URL: string
  getImageUrl: (path?: string) => string
  isItemInWatchlist: (item: MediaItem) => boolean
  getSlug: (title?: string) => string
}

export const Movies: React.FC<MoviesProps> = ({
  API_BASE_URL,
  getImageUrl,
  isItemInWatchlist,
  getSlug
}) => {
  const navigate = useNavigate()

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('popularity')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage] = useState<number>(24)

  // API Data States
  const [mediaList, setMediaList] = useState<MediaItem[]>([])
  const [pagination, setPagination] = useState<MetaPagination | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Debouncer
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, 450)
    return () => clearTimeout(handler)
  }, [searchQuery])

  // Fetch Catalogue
  useEffect(() => {
    const fetchCatalogue = async (): Promise<void> => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.append('page', currentPage.toString())
        params.append('limit', itemsPerPage.toString())
        params.append('sort', sortBy)
        params.append('order', sortOrder)

        if (debouncedSearch) {
          params.append('search', debouncedSearch)
        }
        if (selectedGenre) {
          params.append('genre', selectedGenre)
        }

        const response = await fetch(`${API_BASE_URL}/api/movies?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to load movies')
        }

        const result = await response.json()
        const mapped = (result.data || []).map((m: MediaItem) => ({
          ...m,
          slug: m.slug || getSlug(m.title || m.name)
        }))
        setMediaList(mapped)
        setPagination(result.meta || null)
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Something went wrong fetching catalogue'
        setError(errorMsg)
      } finally {
        setLoading(false)
      }
    }

    fetchCatalogue()
  }, [
    debouncedSearch,
    selectedGenre,
    sortBy,
    sortOrder,
    currentPage,
    API_BASE_URL,
    getSlug,
    itemsPerPage
  ])

  const availableGenres = [
    'Action',
    'Adventure',
    'Science Fiction',
    'Comedy',
    'Drama',
    'Thriller',
    'Animation'
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* FILTERS CONTROL PANEL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/45 border border-border p-5 rounded-2xl backdrop-blur-md">
        {/* Search query input */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="size-4 text-muted-foreground" />
          </span>
          <input
            type="text"
            placeholder="Search movies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted/70 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/45 transition-all duration-300"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Dropdown controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value)
                setCurrentPage(1)
              }}
              className="bg-muted/70 border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/45 cursor-pointer"
            >
              <option value="popularity">Popularity</option>
              <option value="vote_average">User Score</option>
              <option value="release_date">Release Date</option>
              <option value="created_at">Date Imported</option>
              <option value="title">Alphabetical</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value as 'asc' | 'desc')
                setCurrentPage(1)
              }}
              className="bg-muted/70 border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/45 cursor-pointer"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>

          {selectedGenre && (
            <button
              onClick={() => {
                setSelectedGenre('')
                setCurrentPage(1)
              }}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs font-bold hover:bg-primary/25 transition-colors cursor-pointer"
            >
              Reset Genre Filter <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      {/* Genre Pills Row */}
      <div className="flex flex-wrap items-center gap-2 py-1">
        <span className="text-xs font-bold text-muted-foreground mr-2">Genres:</span>
        <button
          onClick={() => {
            setSelectedGenre('')
            setCurrentPage(1)
          }}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer ${
            !selectedGenre
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
              : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
        >
          All
        </button>
        {availableGenres.map((genre) => (
          <button
            key={genre}
            onClick={() => {
              setSelectedGenre(genre)
              setCurrentPage(1)
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer ${
              selectedGenre === genre
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 border border-transparent'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>

      {/* CATALOG GRID BODY */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-28 gap-4">
          <Loader2 className="size-8 text-primary animate-spin" />
          <span className="text-sm text-muted-foreground font-medium">
            Querying Cineverse database...
          </span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <X className="size-10 text-destructive bg-destructive/10 p-2.5 rounded-full border border-destructive/20" />
          <h4 className="text-base font-bold text-foreground">Failed to load movies</h4>
          <p className="text-sm text-muted-foreground max-w-md">{error}</p>
        </div>
      ) : mediaList.length > 0 ? (
        <div className="space-y-8">
          {/* Grid list of posters */}
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {mediaList.map((item) => (
              <div
                key={item.id}
                onClick={() =>
                  navigate('/movies/' + (item.slug || getSlug(item.title || item.name)))
                }
                className="group flex flex-col gap-3 rounded-2xl bg-card/40 border border-border p-3 transition-all duration-300 hover:bg-accent/60 hover:-translate-y-1.5 hover:shadow-2xl cursor-pointer"
              >
                <div className="relative aspect-2/3 overflow-hidden rounded-xl bg-muted">
                  <img
                    src={getImageUrl(item.posterPath)}
                    alt={item.title || item.name}
                    className="h-full w-full object-cover transition-all duration-500 group-hover:scale-105"
                  />

                  {/* Score Badge */}
                  <div className="absolute top-2.5 right-2.5 flex h-7 items-center gap-0.5 rounded-lg bg-card/85 px-2 text-xs font-bold text-primary border border-border/80 backdrop-blur-sm">
                    <Star className="size-3.5 fill-primary text-primary" />
                    {item.voteAverage?.toFixed(1) || 'N/A'}
                  </div>

                  {/* Watchlisted tiny badge indicator */}
                  {isItemInWatchlist(item) && (
                    <div className="absolute top-2.5 left-2.5 flex h-7 w-7 items-center justify-center rounded-lg bg-primary/90 text-primary-foreground backdrop-blur-sm border border-primary/20 shadow-md">
                      <Star className="size-3.5 fill-primary-foreground text-primary-foreground" />
                    </div>
                  )}

                  {/* Info Overlay Panel */}
                  <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                    <span className="text-[10px] text-primary uppercase tracking-widest font-extrabold mb-1">
                      {item.status}
                    </span>
                    <h5 className="text-xs font-bold text-foreground line-clamp-2">
                      {item.title || item.name}
                    </h5>
                  </div>
                </div>

                {/* Title descriptions */}
                <div className="flex flex-col px-1">
                  <h4 className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {item.title || item.name}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold mt-0.5">
                    <span>
                      {item.releaseDate
                        ? new Date(item.releaseDate).getFullYear()
                        : item.firstAirDate
                          ? new Date(item.firstAirDate).getFullYear()
                          : 'N/A'}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] bg-card border border-border px-2 py-0.5 rounded text-muted-foreground">
                      Movie
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* MODERN PAGINATION BAR */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-6 px-2">
              <span className="text-xs font-semibold text-muted-foreground">
                Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} -{' '}
                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}{' '}
                of {pagination.totalItems} titles
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={pagination.currentPage === 1}
                  onClick={() => setCurrentPage(pagination.currentPage - 1)}
                  className="flex items-center gap-1 rounded-xl border border-border bg-card/30 px-3.5 py-2 text-xs font-bold text-foreground transition-all hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="size-4" /> Prev
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, idx) => idx + 1).map(
                    (pNum) => {
                      if (
                        pNum === 1 ||
                        pNum === pagination.totalPages ||
                        Math.abs(pNum - pagination.currentPage) <= 1
                      ) {
                        return (
                          <button
                            key={pNum}
                            onClick={() => setCurrentPage(pNum)}
                            className={`h-9 w-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              pagination.currentPage === pNum
                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                                : 'border border-transparent bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground'
                            }`}
                          >
                            {pNum}
                          </button>
                        )
                      }
                      if (pNum === 2 || pNum === pagination.totalPages - 1) {
                        return (
                          <span
                            key={pNum}
                            className="text-xs text-muted-foreground px-1 select-none"
                          >
                            ...
                          </span>
                        )
                      }
                      return null
                    }
                  )}
                </div>

                <button
                  disabled={pagination.currentPage === pagination.totalPages}
                  onClick={() => setCurrentPage(pagination.currentPage + 1)}
                  className="flex items-center gap-1 rounded-xl border border-border bg-card/30 px-3.5 py-2 text-xs font-bold text-foreground transition-all hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-30 cursor-pointer"
                >
                  Next <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3 bg-card/20 border border-dashed border-border rounded-2xl">
          <Film className="size-10 text-muted-foreground" />
          <h4 className="text-base font-bold text-foreground">No matches found</h4>
          <p className="text-sm text-muted-foreground max-w-sm">
            No items in the catalogue matched your active search term or selected genre.
          </p>
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedGenre('')
            }}
            className="mt-2 text-xs font-bold text-primary hover:underline cursor-pointer"
          >
            Clear Search Filters
          </button>
        </div>
      )}
    </div>
  )
}
