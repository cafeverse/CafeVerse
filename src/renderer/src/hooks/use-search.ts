import { useState, useEffect, useCallback } from 'react'
import type { MediaItem, SearchType, AutocompleteItem } from '@/types'

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

/** Normalises every possible shape the autocomplete API can return into a flat list. */
function resolveAutocomplete(data: unknown): AutocompleteItem[] {
  if (Array.isArray(data)) return data as AutocompleteItem[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.data)) return obj.data as AutocompleteItem[]
    if (Array.isArray(obj.items)) return obj.items as AutocompleteItem[]
    if (Array.isArray(obj.results)) return obj.results as AutocompleteItem[]
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

async function fetchAutocomplete(
  query: string,
  type: SearchType,
  signal: AbortSignal
): Promise<AutocompleteItem[]> {
  const params = new URLSearchParams({ q: query })
  if (type !== 'all') params.set('type', type)

  const res = await fetch(`${API_BASE_URL}/search/autocomplete?${params}`, { signal })
  if (!res.ok) throw new Error(`Autocomplete HTTP ${res.status}`)
  return resolveAutocomplete(await res.json())
}

export interface UseSearchReturn {
  query: string
  setQuery: (q: string) => void
  results: MediaItem[]
  isSearching: boolean
  type: SearchType
  setType: (t: SearchType) => void
  clear: () => void
  autocompleteResults: AutocompleteItem[]
  isAutocompleting: boolean
}

/**
 * Manages debounced real-time search against /search and /search/autocomplete endpoints.
 * Debounce: 200ms for autocomplete, 400ms for search. Cancels in-flight requests on query change.
 */
export function useSearch(): UseSearchReturn {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<SearchType>('all')
  const [results, setResults] = useState<MediaItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [autocompleteResults, setAutocompleteResults] = useState<AutocompleteItem[]>([])
  const [isAutocompleting, setIsAutocompleting] = useState(false)

  const resetResults = useCallback(() => {
    setResults([])
    setAutocompleteResults([])
    setIsSearching(false)
    setIsAutocompleting(false)
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

    // Autocomplete: fast debounce
    const autocompleteTimer = setTimeout(async () => {
      setIsAutocompleting(true)
      try {
        const data = await fetchAutocomplete(query, type, controller.signal)
        setAutocompleteResults(data)
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('[useSearch] autocomplete query failed:', err)
          setAutocompleteResults([])
        }
      } finally {
        setIsAutocompleting(false)
      }
    }, 200)

    // Full Search: standard debounce
    const searchTimer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const data = await fetchSearch(query, type, controller.signal)
        setResults(data)
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('[useSearch] search query failed:', err)
          setResults([])
        }
      } finally {
        setIsSearching(false)
      }
    }, 400)

    return () => {
      clearTimeout(autocompleteTimer)
      clearTimeout(searchTimer)
      controller.abort()
    }
  }, [query, type])

  return {
    query,
    setQuery: updateQuery,
    results,
    isSearching,
    type,
    setType,
    clear,
    autocompleteResults,
    isAutocompleting
  }
}
