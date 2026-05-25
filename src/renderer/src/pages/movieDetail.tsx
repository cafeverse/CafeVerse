import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Star,
  Clock,
  Heart,
  Award,
  Video,
  ExternalLink,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Loader2,
  Film
} from 'lucide-react'
import { MediaItem } from '@/types'

interface MovieDetailProps {
  API_BASE_URL: string
  getImageUrl: (path?: string) => string
  toggleWatchlist: (item: MediaItem) => void
  isItemInWatchlist: (item: MediaItem) => boolean
  getSlug: (title?: string) => string
}

export const MovieDetail: React.FC<MovieDetailProps> = ({
  API_BASE_URL,
  getImageUrl,
  toggleWatchlist,
  isItemInWatchlist,
  getSlug
}) => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const [movie, setMovie] = useState<MediaItem | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Interactive Player States
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const [isMuted, setIsMuted] = useState<boolean>(false)
  const [playerVolume, setPlayerVolume] = useState<number>(75)

  useEffect(() => {
    const fetchMovie = async (): Promise<void> => {
      setLoading(true)
      setError(null)
      try {
        // 1. Fetch movies catalogue to resolve by slug
        const response = await fetch(`${API_BASE_URL}/api/movies?limit=100`)
        if (!response.ok) {
          throw new Error('Failed to load movies database')
        }
        const result = await response.json()
        const movies: MediaItem[] = result.data || []

        // Find movie where slug matches
        const matchedMovie = movies.find((m) => getSlug(m.title) === slug)

        if (!matchedMovie) {
          // Fallback: Check if slug is database ID
          const parsedId = parseInt(slug || '', 10)
          if (!isNaN(parsedId)) {
            const detailRes = await fetch(`${API_BASE_URL}/api/movies/${parsedId}`)
            if (detailRes.ok) {
              const detailData = await detailRes.json()
              setMovie(detailData)
              setLoading(false)
              return
            }
          }
          throw new Error('Movie not found in the Cineverse database.')
        }

        // 2. Fetch full details by database ID
        const detailRes = await fetch(`${API_BASE_URL}/api/movies/${matchedMovie.id}`)
        if (!detailRes.ok) {
          // Fallback to matched catalog movie
          setMovie(matchedMovie)
        } else {
          const detailData = await detailRes.json()
          setMovie(detailData)
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'An error occurred loading movie details'
        setError(errorMsg)
      } finally {
        setLoading(false)
      }
    }

    fetchMovie()
  }, [slug, API_BASE_URL, getSlug])

  // Mock player progress interval
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false)
            return 0
          }
          return prev + 0.5
        })
      }, 500)
    }
    return () => clearInterval(interval)
  }, [isPlaying])

  const handlePlayToggle = (): void => {
    setIsPlaying(!isPlaying)
  }

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setProgress(parseFloat(e.target.value))
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const vol = parseInt(e.target.value, 10)
    setPlayerVolume(vol)
    if (vol === 0) {
      setIsMuted(true)
    } else {
      setIsMuted(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-36 gap-4">
        <Loader2 className="size-10 text-primary animate-spin" />
        <span className="text-sm text-muted-foreground font-medium">
          Resolving movie metadata...
        </span>
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <Film className="size-12 text-destructive bg-destructive/10 p-3 rounded-full border border-destructive/20" />
        <h4 className="text-lg font-bold text-foreground">Movie Details Unavailable</h4>
        <p className="text-sm text-muted-foreground max-w-md">
          {error || 'Unable to retrieve title content.'}
        </p>
        <button
          onClick={() => navigate('/movies')}
          className="mt-2 px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
        >
          <ArrowLeft className="size-4" /> Return to Catalogue
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-16">
      {/* Back navigation & Watchlist header buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/movies')}
          className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-card border border-border px-4 py-2 rounded-xl"
        >
          <ArrowLeft className="size-4" /> Back to Movies
        </button>

        <button
          onClick={() => toggleWatchlist(movie)}
          className={`flex items-center gap-2 border px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            isItemInWatchlist(movie)
              ? 'border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20'
              : 'border-border bg-card text-foreground hover:bg-accent'
          }`}
        >
          <Heart
            className={`size-4 ${isItemInWatchlist(movie) ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`}
          />
          <span>{isItemInWatchlist(movie) ? 'Bookmarked' : 'Add to Watchlist'}</span>
        </button>
      </div>

      {/* Hero Header Area */}
      <div className="relative rounded-3xl overflow-hidden border border-border bg-card shadow-2xl">
        {/* Backdrop visual container */}
        <div className="relative h-96 w-full shrink-0">
          <img
            src={getImageUrl(movie.backdropPath)}
            alt={movie.title}
            className="h-full w-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-card/30" />
        </div>

        {/* Content body offset overlay */}
        <div className="relative p-8 md:p-12 -mt-28 z-10 flex flex-col md:flex-row gap-8 items-start">
          {/* Poster image card */}
          <div className="w-48 md:w-56 shrink-0 aspect-2/3 rounded-2xl overflow-hidden shadow-2xl border border-border bg-muted">
            <img
              src={getImageUrl(movie.posterPath)}
              alt={movie.title}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Details column */}
          <div className="flex-1 space-y-4 md:pt-24 pt-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex items-center gap-0.5 rounded-md bg-secondary px-2.5 py-1 text-xs font-bold text-secondary-foreground border border-border">
                <Star className="size-3.5 fill-primary text-primary" />
                {movie.voteAverage?.toFixed(1) || 'N/A'} Score
              </span>
              {movie.status && (
                <span className="rounded-md bg-primary/15 border border-primary/25 px-2.5 py-1 text-[10px] font-bold text-primary uppercase tracking-wider">
                  {movie.status}
                </span>
              )}
              <span className="rounded-md bg-muted border border-border px-2.5 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Movie
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
              {movie.title}
            </h2>

            {movie.tagline && (
              <p className="text-sm font-semibold italic text-primary/95">
                &ldquo;{movie.tagline}&rdquo;
              </p>
            )}

            {/* Genres Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {movie.genres &&
                movie.genres.map((g) => (
                  <span
                    key={g}
                    className="rounded-full bg-muted border border-border px-3 py-1 text-xs font-semibold text-muted-foreground"
                  >
                    {g}
                  </span>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Synopsis & Meta details on left, Streaming player on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Info & Details (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Plot Synopsis card */}
          <div className="space-y-3 bg-card border border-border p-6 rounded-2xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Synopsis
            </h3>
            <p className="text-sm text-foreground leading-relaxed">
              {movie.overview || 'No description exists for this title.'}
            </p>
          </div>

          {/* Meta Information list */}
          <div className="grid grid-cols-2 gap-4 bg-card border border-border p-6 rounded-2xl text-xs">
            {movie.releaseDate && (
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground font-bold uppercase tracking-widest text-[9px]">
                  Release Date
                </span>
                <span className="text-foreground font-semibold">
                  {new Date(movie.releaseDate).toLocaleDateString(undefined, {
                    dateStyle: 'medium'
                  })}
                </span>
              </div>
            )}
            {movie.runtime && (
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground font-bold uppercase tracking-widest text-[9px]">
                  Runtime
                </span>
                <span className="text-foreground font-semibold flex items-center gap-1">
                  <Clock className="size-3.5 text-primary" /> {movie.runtime} minutes
                </span>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground font-bold uppercase tracking-widest text-[9px]">
                Popularity Rank
              </span>
              <span className="text-foreground font-semibold">
                {movie.popularity?.toFixed(2) || 'N/A'}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground font-bold uppercase tracking-widest text-[9px]">
                IMDb Identifier
              </span>
              {movie.imdbId ? (
                <a
                  href={`https://www.imdb.com/title/${movie.imdbId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:text-primary/80 flex items-center gap-1 font-semibold"
                >
                  {movie.imdbId} <ExternalLink className="size-3" />
                </a>
              ) : (
                <span className="text-muted-foreground font-semibold">Not Available</span>
              )}
            </div>
            <div className="flex flex-col gap-1 col-span-2 border-t border-border/40 pt-4 mt-2">
              <span className="text-muted-foreground font-bold uppercase tracking-widest text-[9px]">
                URL Slug
              </span>
              <span className="text-primary font-mono font-semibold truncate select-all">
                {movie.slug || getSlug(movie.title)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Mock Stream Video Player (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl flex flex-col h-full">
            {/* Player Title Bar */}
            <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-muted/30">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Video className="size-3.5 text-primary" /> Cineverse Mock Stream
              </span>
              <span className="text-[9px] font-mono bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded uppercase font-bold">
                1080P Ultra
              </span>
            </div>

            {/* Video Canvas Backdrop Frame */}
            <div className="relative aspect-video bg-background flex items-center justify-center overflow-hidden border-b border-border group/player">
              {movie.backdropPath ? (
                <img
                  src={getImageUrl(movie.backdropPath)}
                  alt="streaming placeholder"
                  className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${isPlaying ? 'scale-105 opacity-20' : 'opacity-40 blur-xs'}`}
                />
              ) : (
                <div className="absolute inset-0 bg-muted/20" />
              )}

              {/* Status / Floating controls */}
              <div className="relative z-10 flex flex-col items-center gap-2 text-center p-4">
                <button
                  onClick={handlePlayToggle}
                  className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 hover:bg-primary/95 transition-all cursor-pointer"
                >
                  {isPlaying ? (
                    <Pause className="size-6 fill-primary-foreground" />
                  ) : (
                    <Play className="size-6 fill-primary-foreground ml-1" />
                  )}
                </button>
                <span className="text-[11px] font-bold text-foreground">
                  {isPlaying ? 'Streaming Content Feed...' : 'Ready to Stream'}
                </span>
                <span className="text-[9px] text-muted-foreground select-none max-w-xs font-medium">
                  {isPlaying
                    ? 'Simulated PostgreSQL read schedules and Redis pings active'
                    : 'Click Play to start local simulated cache buffer stream'}
                </span>
              </div>

              {/* Custom floating streaming url alert */}
              {isPlaying && (
                <div className="absolute top-2 left-2 right-2 bg-card/90 border border-border p-2 rounded-lg text-[9px] font-mono truncate animate-fade-in shadow-md">
                  <span className="text-primary font-bold">Endpoint:</span>{' '}
                  {`${API_BASE_URL}/stream/movie/${movie.slug || getSlug(movie.title)}`}
                </div>
              )}
            </div>

            {/* Simulated Player Controls Bar */}
            <div className="p-4 space-y-3.5 bg-muted/15 flex-1 flex flex-col justify-center">
              {/* Timeline Progress Slider */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-muted-foreground font-semibold">
                  {Math.floor((progress / 100) * 120)}:
                  {String(Math.floor(((progress / 100) * 120 * 60) % 60)).padStart(2, '0')}
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={progress}
                  onChange={handleProgressChange}
                  className="flex-1 accent-primary bg-muted rounded-lg h-1.5 cursor-pointer"
                />
                <span className="text-[10px] font-mono text-muted-foreground font-semibold">
                  120:00
                </span>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePlayToggle}
                    className="text-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
                  </button>

                  <div className="flex items-center gap-1.5 group/volume">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="text-foreground hover:text-primary transition-colors cursor-pointer"
                    >
                      {isMuted || playerVolume === 0 ? (
                        <VolumeX className="size-4" />
                      ) : (
                        <Volume2 className="size-4" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={isMuted ? 0 : playerVolume}
                      onChange={handleVolumeChange}
                      className="accent-primary bg-muted rounded-lg h-1 w-14 cursor-pointer"
                    />
                  </div>
                </div>

                <button className="text-foreground hover:text-primary transition-colors cursor-pointer">
                  <Maximize2 className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Cast Carousel Horizontal list */}
      {movie.cast && movie.cast.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Award className="size-5 text-primary" /> Top Billed Cast
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
            {movie.cast.map((c, i) => (
              <div
                key={i}
                className="flex w-32 shrink-0 flex-col items-center text-center gap-2.5 bg-card border border-border p-3.5 rounded-2xl transition-all hover:bg-accent/40"
              >
                <div className="h-16 w-16 overflow-hidden rounded-full border border-border bg-muted shadow-inner">
                  {c.profilePath ? (
                    <img
                      src={getImageUrl(c.profilePath)}
                      alt={c.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary/10 text-sm font-bold text-primary">
                      {c.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-foreground line-clamp-1">{c.name}</span>
                  <span className="text-[10px] text-muted-foreground line-clamp-1 italic font-medium">
                    {c.character}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Homepage redirect button */}
      {movie.homepage && (
        <a
          href={movie.homepage}
          target="_blank"
          rel="noreferrer"
          className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 rounded-2xl bg-card hover:bg-accent border border-border py-3.5 text-xs font-bold text-foreground transition-all duration-300 shadow-md"
        >
          <Video className="size-4.5 text-primary" />
          <span>Visit Official Movie Homepage</span>
          <ExternalLink className="size-3.5" />
        </a>
      )}
    </div>
  )
}
