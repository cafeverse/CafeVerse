import { useState, useEffect, useCallback } from 'react'
import type { MediaItem, SearchType } from '@/types'

const API_BASE_URL = 'https://cafeverce-api.vercel.app'

/** Normalises every possible shape the search API can return into a flat list. */
function resolveResults(data: unknown): MediaItem[] {
  if (Array.isArray(data)) return data as MediaItem[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.data)) return obj.data as MediaItem[]
    if (Array.isArray(obj.items)) return obj.items as MediaItem[]
    if (Array.isArray(obj.results)) return obj.results as MediaItem[]
  }
  return []
}

async function fetchSearch(
  query: string,
  type: SearchType,
  signal: AbortSignal
): Promise<MediaItem[]> {
  const params = new URLSearchParams({ q: query, page: '1', limit: '12' })
  if (type !== 'all') params.set('type', type)

  const res = await fetch(`${API_BASE_URL}/search?${params}`, { signal })
  if (!res.ok) throw new Error(`Search HTTP ${res.status}`)
  return resolveResults(await res.json())
}

export interface UseSearchReturn {
  query: string
  setQuery: (q: string) => void
  results: MediaItem[]
  isSearching: boolean
  type: SearchType
  setType: (t: SearchType) => void
  clear: () => void
}

/**
 * Manages debounced real-time search against /search endpoint.
 * Debounce: 400 ms. Cancels in-flight requests on query change.
 */
export function useSearch(): UseSearchReturn {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<SearchType>('all')
  const [results, setResults] = useState<MediaItem[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const resetResults = useCallback(() => {
    setResults([])
    setIsSearching(false)
  }, [])

  const updateQuery = useCallback(
    (q: string) => {
      setQuery(q)
      if (!q.trim()) resetResults()
    },
    [resetResults]
  )

  const clear = useCallback(() => {
    setQuery('')
    resetResults()
  }, [resetResults])

  useEffect(() => {
    if (!query.trim()) return

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const data = await fetchSearch(query, type, controller.signal)
        setResults(data)
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('[useSearch] query failed:', err)
          setResults([])
        }
      } finally {
        setIsSearching(false)
      }
    }, 400)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, type])

  return { query, setQuery: updateQuery, results, isSearching, type, setType, clear }
}
