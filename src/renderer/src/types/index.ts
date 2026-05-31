export interface CastMember {
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
  seasons?: SeasonMeta[]
}

export interface MetaPagination {
  currentPage: number
  itemCount: number
  itemsPerPage: number
  totalItems: number
  totalPages: number
}

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
