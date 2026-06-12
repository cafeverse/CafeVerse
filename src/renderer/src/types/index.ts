import type React from 'react'
import type { cleanReleaseNotes } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Media types
// ---------------------------------------------------------------------------

export type SortKey = 'popularity' | 'voteAverage' | 'releaseDate' | 'title' | 'createdAt'
export type SortOrder = 'asc' | 'desc'

export interface SortOption {
  label: string
  key: SortKey
  order: SortOrder
}

export interface CastMember {
  id?: number
  name: string
  character: string
  profilePath: string
}

export interface Episode {
  id: number
  name: string
  overview: string
  episodeNumber: number
  seasonNumber: number
  airDate?: string | null
  stillPath?: string | null
  voteAverage?: number
}

export interface SeasonMeta {
  id: number
  airDate?: string | null
  episodes?: Episode[] | null
  name: string
  overview?: string | null
  seasonNumber: number
  posterPath?: string | null
  episodeCount?: number
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
  contentType: 'movie' | 'tv' | 'anime'
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
  seasons?: SeasonMeta[]
  watchedAt?: string
  activeSeason?: number
  activeEpisode?: number
}

// ---------------------------------------------------------------------------
// Search types
// ---------------------------------------------------------------------------

/** Filter scope for the /search and /search/autocomplete endpoints. */
export type SearchType = 'all' | 'movie' | 'tv'

/**
 * Lightweight item shape returned by GET /search/autocomplete.
 * Contains only the fields needed to render a dropdown suggestion row.
 */
export interface AutocompleteItem {
  id: number
  title?: string
  name?: string
  contentType: 'movie' | 'tv' | 'anime'
  posterPath?: string
  releaseDate?: string
  firstAirDate?: string
  /** Trigram similarity score returned by the API (0–1). */
  similarity: number
}

// ---------------------------------------------------------------------------
// API utility types
// ---------------------------------------------------------------------------

/** Pagination metadata returned by list endpoints */
export interface MetaPagination {
  currentPage: number
  itemCount: number
  itemsPerPage: number
  totalItems: number
  totalPages: number
}

/** Shape of the /health endpoint response */
export interface HealthStatus {
  status: string
  timestamp: string
  environment: string
  services: {
    postgres: {
      status: string
      message: string
    }
    redis: {
      status: string
      message: string
    }
  }
}

// ---------------------------------------------------------------------------
// Auth types
// ---------------------------------------------------------------------------

export interface User {
  id: number
  username: string
  email: string
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  token: string
  user: User
}

// ---------------------------------------------------------------------------
// App-wide outlet context type (shared between layout and child pages)
// ---------------------------------------------------------------------------

export interface AppContextType {
  watchlist: MediaItem[]
  setWatchlist: React.Dispatch<React.SetStateAction<MediaItem[]>>
  getImageUrl: (path?: string) => string
  getSlug: (title?: string) => string
  toggleWatchlist: (item: MediaItem) => void
  isItemInWatchlist: (item: MediaItem) => boolean
  API_BASE_URL: string
  updateInfo: { version: string; releaseNotes?: string } | null
  downloading: boolean
  downloadProgress: number
  downloaded: boolean
  updaterError: string | null
  currentVersion: string
  cleanReleaseNotes: typeof cleanReleaseNotes
  watchHistory: MediaItem[]
  addToWatchHistory: (item: MediaItem, season?: number, episode?: number) => void
  removeFromWatchHistory: (itemId: number, contentType: string) => void
  clearWatchHistory: () => void
}
