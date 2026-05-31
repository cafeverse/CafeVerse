import React, { useState, useEffect, useMemo } from 'react'
import { Search, X, Loader2, Star, ChevronLeft, ChevronRight, Tv } from 'lucide-react'
import { MediaItem, MetaPagination } from '@/types'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { AppContextType } from '../layout'

export default function TvShowsPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { API_BASE_URL, getImageUrl, isItemInWatchlist, getSlug } =
    useOutletContext<AppContextType>()

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<string>('popularity')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage] = useState<number>(12)

  // API Data States
  const [allMedia, setAllMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [availableGenres, setAvailableGenres] = useState<string[]>([])

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, 450)
    return () => clearTimeout(handler)
  }, [searchQuery])

  // Fetch all TV shows once on mount
  useEffect(() => {
    const fetchAllTvShows = async (): Promise<void> => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${API_BASE_URL}/api/tvshows?page=1&limit=100`)
        if (!response.ok) {
          throw new Error('Failed to load TV shows')
        }

        const result = await response.json()
        let items: MediaItem[] = result.data || []

        const meta = result.meta as MetaPagination
        if (meta && meta.totalPages > 1) {
          const promises: Promise<{ data?: MediaItem[] }>[] = []
          for (let p = 2; p <= meta.totalPages; p++) {
            promises.push(
              fetch(`${API_BASE_URL}/api/tvshows?page=${p}&limit=100`).then((res) =>
                res.ok ? res.json() : { data: [] }
              )
            )
          }
          const results = await Promise.all(promises)
          results.forEach((res) => {
            if (res.data) {
              items = items.concat(res.data)
            }
          })
        }

        const mapped = items.map((m: MediaItem) => ({
          ...m,
          slug: m.slug || getSlug(m.title || m.name)
        }))

        setAllMedia(mapped)

        // Extract available genres
        const genresSet = new Set<string>()
        mapped.forEach((item) => {
          if (item.genres && Array.isArray(item.genres)) {
            item.genres.forEach((g) => {
              if (g) genresSet.add(g)
            })
          }
        })
        setAvailableGenres(Array.from(genresSet).sort())
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Something went wrong fetching catalogue'
        setError(errorMsg)
      } finally {
        setLoading(false)
      }
    }

    fetchAllTvShows()
  }, [API_BASE_URL, getSlug])

  // Client-side search, filtering, sorting, and pagination
  const filteredAndSortedMedia = useMemo(() => {
    let result = [...allMedia]

    // 1. Search Query Filter
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim()
      result = result.filter(
        (item) =>
          (item.title || item.name || '').toLowerCase().includes(q) ||
          (item.originalTitle || item.originalName || '').toLowerCase().includes(q) ||
          (item.overview || '').toLowerCase().includes(q)
      )
    }

    // 2. Multiple Genres Filter (AND match: TV show must contain ALL selected genres)
    if (selectedGenres.length > 0) {
      result = result.filter((item) => {
        const itemGenres = item.genres || []
        return selectedGenres.every((sg) => itemGenres.includes(sg))
      })
    }

    // 3. Sorting
    const sortFieldMap: Record<string, keyof MediaItem> = {
      popularity: 'popularity',
      vote_average: 'voteAverage',
      first_air_date: 'firstAirDate',
      created_at: 'createdAt',
      name: 'name'
    }
    const sortField = sortFieldMap[sortBy] || (sortBy as keyof MediaItem)

    result.sort((a, b) => {
      let valA = a[sortField] as string | number | undefined
      let valB = b[sortField] as string | number | undefined

      if (valA === undefined || valA === null) valA = ''
      if (valB === undefined || valB === null) valB = ''

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA
      }

      if (sortField === 'firstAirDate' || sortField === 'createdAt') {
        const dateA = valA ? new Date(valA as string).getTime() : 0
        const dateB = valB ? new Date(valB as string).getTime() : 0
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
      }

      const strA = String(valA).toLowerCase()
      const strB = String(valB).toLowerCase()
      return sortOrder === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA)
    })

    return result
  }, [allMedia, debouncedSearch, selectedGenres, sortBy, sortOrder])

  // Derive current page media items
  const mediaList = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedMedia.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedMedia, currentPage, itemsPerPage])

  // Derive pagination metadata
  const pagination = useMemo<MetaPagination | null>(() => {
    const totalItems = filteredAndSortedMedia.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    return {
      currentPage,
      itemCount: mediaList.length,
      itemsPerPage,
      totalItems,
      totalPages
    }
  }, [filteredAndSortedMedia.length, mediaList.length, currentPage, itemsPerPage])

  return (
    <div className="space-y-8 md:space-y-10 animate-fade-in pb-12">
      {/* 1. CINEMATIC CONTROL CENTER */}
      <div className="flex flex-col gap-6 bg-card/25 border border-border/40 p-6 sm:p-8 rounded-4xl backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
        {/* Ambient background glow inside the panel */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/5 blur-[80px] pointer-events-none group-hover:bg-primary/10 transition-colors duration-700" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Search query input */}
          <div className="relative flex-1 max-w-2xl group/input">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="size-5 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors" />
            </span>
            <input
              type="text"
              placeholder="Search cinematic series..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-muted/30 hover:bg-muted/50 border border-border/50 rounded-2xl pl-12 pr-12 py-4 text-base font-medium text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all duration-500 shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setCurrentPage(1)
                }}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <X className="size-5" />
              </button>
            )}
          </div>

          {/* Dropdown controls */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest pl-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value)
                  setCurrentPage(1)
                }}
                className="bg-muted/40 hover:bg-muted/60 border border-border/40 rounded-xl px-5 py-3 text-sm font-bold text-foreground focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 cursor-pointer min-h-12 transition-all appearance-none"
              >
                <option value="popularity">Popularity</option>
                <option value="vote_average">User Score</option>
                <option value="first_air_date">First Air Date</option>
                <option value="created_at">Imported</option>
                <option value="name">A-Z</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest pl-1">
                Order
              </label>
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value as 'asc' | 'desc')
                  setCurrentPage(1)
                }}
                className="bg-muted/40 hover:bg-muted/60 border border-border/40 rounded-xl px-5 py-3 text-sm font-bold text-foreground focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 cursor-pointer min-h-12 transition-all appearance-none"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Genre Pill Selection - Integrated */}
        <div className="space-y-3 relative z-10 border-t border-border/40 pt-6">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">
              Genre Library
            </span>
            {selectedGenres.length > 0 && (
              <button
                onClick={() => {
                  setSelectedGenres([])
                  setCurrentPage(1)
                }}
                className="text-[10px] font-black text-primary hover:text-primary/80 uppercase tracking-widest transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
          <div className="flex flex-row items-center overflow-x-auto pb-2 gap-2.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
            <button
              onClick={() => {
                setSelectedGenres([])
                setCurrentPage(1)
              }}
              className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 cursor-pointer shrink-0 border ${
                selectedGenres.length === 0
                  ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                  : 'bg-muted/30 border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-border/60'
              }`}
            >
              All Genres
            </button>
            {availableGenres.map((genre) => {
              const isSelected = selectedGenres.includes(genre)
              return (
                <button
                  key={genre}
                  onClick={() => {
                    setSelectedGenres((prev) =>
                      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
                    )
                    setCurrentPage(1)
                  }}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 cursor-pointer shrink-0 border ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                      : 'bg-muted/30 border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-border/60'
                  }`}
                >
                  {genre}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* CATALOG GRID BODY */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-28 gap-4">
          <Loader2 className="size-8 text-primary animate-spin" />
          <span className="text-sm text-muted-foreground font-medium">
            Querying CaféVerse database...
          </span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <X className="size-10 text-destructive bg-destructive/10 p-2.5 rounded-full border border-destructive/20" />
          <h4 className="text-base font-bold text-foreground">Failed to load TV shows</h4>
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
                  navigate(`/tvshows/${item.slug || getSlug(item.title || item.name)}`)
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
                    <span className="flex items-center gap-1">
                      <span>
                        {item.releaseDate
                          ? new Date(item.releaseDate).getFullYear()
                          : item.firstAirDate
                            ? new Date(item.firstAirDate).getFullYear()
                            : 'N/A'}
                      </span>
                      {(item.numberOfSeasons || item.numberOfEpisodes) && (
                        <span className="text-muted-foreground/60 font-medium select-none text-[10px]">
                          &bull; {item.numberOfSeasons && `${item.numberOfSeasons}S`}
                          {item.numberOfSeasons && item.numberOfEpisodes && '/'}
                          {item.numberOfEpisodes && `${item.numberOfEpisodes}E`}
                        </span>
                      )}
                    </span>

                    <span className="flex items-center gap-1 text-[10px] bg-card border border-border px-2 py-0.5 rounded text-muted-foreground/50">
                      TV Series
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
          <Tv className="size-10 text-muted-foreground" />
          <h4 className="text-base font-bold text-foreground">No matches found</h4>
          <p className="text-sm text-muted-foreground max-w-sm">
            No items in the catalogue matched your active search term or selected genres.
          </p>
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedGenres([])
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
