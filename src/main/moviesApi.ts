import { ipcMain } from 'electron'

export interface CastMember {
  name: string
  character: string
  profilePath: string
}

export interface MediaItem {
  id: number
  tmdbId: number
  imdbId: string
  title?: string
  name?: string
  originalTitle?: string
  originalName?: string
  overview: string
  releaseDate?: string
  firstAirDate?: string
  posterPath: string
  backdropPath: string
  genres: string[]
  voteAverage: number
  voteCount: number
  popularity: number
  status: string
  contentType: 'movie' | 'tv'
  createdAt: string
  tagline?: string
  budget?: number
  revenue?: number
  homepage?: string
  runtime?: number
  numberOfSeasons?: number
  numberOfEpisodes?: number
  cast?: CastMember[]
  slug?: string
}

export interface MetaPagination {
  currentPage: number
  itemCount: number
  itemsPerPage: number
  totalItems: number
  totalPages: number
}

const API_BASE_URL = 'https://movies-api-silk-phi.vercel.app'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface CacheEntry {
  data: MediaItem[]
  timestamp: number
}

let moviesCache: CacheEntry | null = null
let activeFetchPromise: Promise<MediaItem[]> | null = null

// Core function to fetch all movies
async function fetchAllMoviesFromApi(): Promise<MediaItem[]> {
  console.log('[Main Process] Fetching all movies from backend API...')
  const response = await fetch(`${API_BASE_URL}/api/movies?page=1&limit=100`)
  if (!response.ok) {
    throw new Error('Failed to fetch movies from backend API')
  }

  const result = await response.json()
  let items: MediaItem[] = result.data || []

  const meta = result.meta as MetaPagination
  if (meta && meta.totalPages > 1) {
    const promises: Promise<{ data?: MediaItem[] }>[] = []
    for (let p = 2; p <= meta.totalPages; p++) {
      promises.push(
        fetch(`${API_BASE_URL}/api/movies?page=${p}&limit=100`).then((res) =>
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

  return items
}

// Stale-While-Revalidate and Request Deduplication wrapper
async function getMoviesData(): Promise<MediaItem[]> {
  const now = Date.now()

  // 1. If cache is fresh, return immediately
  if (moviesCache && now - moviesCache.timestamp < CACHE_TTL) {
    console.log('[Main Process] Serving movies from fresh cache.')
    return moviesCache.data
  }

  // 2. If cache is stale but exists, return stale data and refresh in background (Stale-While-Revalidate)
  if (moviesCache) {
    console.log('[Main Process] Cache is stale. Serving stale data and refreshing in background...')
    if (!activeFetchPromise) {
      activeFetchPromise = fetchAllMoviesFromApi()
        .then((items) => {
          moviesCache = { data: items, timestamp: Date.now() }
          console.log('[Main Process] Background cache refresh complete.')
          activeFetchPromise = null
          return items
        })
        .catch((err) => {
          console.error('[Main Process] Background cache refresh failed:', err)
          activeFetchPromise = null
          return moviesCache ? moviesCache.data : []
        })
    }
    return moviesCache.data
  }

  // 3. No cache exists. Fetch data (deduplicating concurrent requests)
  if (!activeFetchPromise) {
    activeFetchPromise = fetchAllMoviesFromApi()
      .then((items) => {
        moviesCache = { data: items, timestamp: Date.now() }
        console.log('[Main Process] Cache initialized.')
        activeFetchPromise = null
        return items
      })
      .catch((err) => {
        activeFetchPromise = null
        throw err
      })
  } else {
    console.log('[Main Process] Reusing concurrent loading promise (Request Deduplication).')
  }

  return activeFetchPromise
}

// Register IPC handler
export function registerMoviesIpc(): void {
  ipcMain.handle('fetch-movies', async (_event, params) => {
    try {
      const { page, limit, search, genres, sortBy, sortOrder } = params

      // Load data (via cache/dedup layer)
      const allMovies = await getMoviesData()
      let result = [...allMovies]

      // 1. Search Query Filter
      if (search && search.trim()) {
        const q = search.toLowerCase().trim()
        result = result.filter(
          (item) =>
            (item.title || item.name || '').toLowerCase().includes(q) ||
            (item.originalTitle || item.originalName || '').toLowerCase().includes(q) ||
            (item.overview || '').toLowerCase().includes(q)
        )
      }

      // 2. Multiple Genres Filter (AND match)
      if (genres && Array.isArray(genres) && genres.length > 0) {
        result = result.filter((item) => {
          const itemGenres = item.genres || []
          return genres.every((sg) => itemGenres.includes(sg))
        })
      }

      // 3. Sorting
      if (sortBy) {
        const sortFieldMap: Record<string, keyof MediaItem> = {
          popularity: 'popularity',
          vote_average: 'voteAverage',
          release_date: 'releaseDate',
          first_air_date: 'firstAirDate',
          created_at: 'createdAt',
          title: 'title'
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

          if (
            sortField === 'releaseDate' ||
            sortField === 'firstAirDate' ||
            sortField === 'createdAt'
          ) {
            const dateA = valA ? new Date(valA as string).getTime() : 0
            const dateB = valB ? new Date(valB as string).getTime() : 0
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
          }

          const strA = String(valA).toLowerCase()
          const strB = String(valB).toLowerCase()
          return sortOrder === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA)
        })
      }

      // 4. Pagination
      const totalItems = result.length
      const totalPages = Math.ceil(totalItems / limit)
      const startIndex = (page - 1) * limit
      const paginatedData = result.slice(startIndex, startIndex + limit)

      const meta: MetaPagination = {
        currentPage: page,
        itemCount: paginatedData.length,
        itemsPerPage: limit,
        totalItems,
        totalPages
      }

      return {
        data: paginatedData,
        meta
      }
    } catch (err) {
      console.error('[Main Process] Error handling fetch-movies IPC:', err)
      throw err
    }
  })
}
