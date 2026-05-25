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
