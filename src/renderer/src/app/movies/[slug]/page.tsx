import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { Star, ChevronLeft, Play } from 'lucide-react'
import { MediaItem } from '@/types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AppContextType } from '../../layout'

export default function MovieDetailPage(): React.JSX.Element {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { API_BASE_URL, getImageUrl, toggleWatchlist, isItemInWatchlist, getSlug } =
    useOutletContext<AppContextType>()

  const [movie, setMovie] = useState<MediaItem | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const activeTag = document.activeElement?.tagName.toLowerCase()
      if (activeTag === 'input' || activeTag === 'textarea') return

      if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault()
        navigate('/movies')
      } else if (e.key.toLowerCase() === 'w' && movie) {
        e.preventDefault()
        toggleWatchlist(movie)
      } else if (e.key.toLowerCase() === 'd') {
        e.preventDefault()
        alert('Starting Movie Download...')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return (): void => window.removeEventListener('keydown', handleKeyDown)
  }, [movie, navigate, toggleWatchlist])

  useEffect(() => {
    const fetchMovie = async (): Promise<void> => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${API_BASE_URL}/api/movies?limit=100`)
        if (!response.ok) {
          throw new Error('Failed to load movies database')
        }
        const result = await response.json()
        const movies: MediaItem[] = result.data || []
        const matchedMovie = movies.find((m) => getSlug(m.title) === slug)

        if (!matchedMovie) {
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
          throw new Error('Movie not found in the CaféVerse database.')
        }

        const detailRes = await fetch(`${API_BASE_URL}/api/movies/${matchedMovie.id}`)
        if (!detailRes.ok) {
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

  // Update Discord activity when movie details are loaded (representing active watching)
  useEffect(() => {
    if (movie) {
      const year = movie.releaseDate ? ` (${new Date(movie.releaseDate).getFullYear()})` : ''
      window.api?.discord?.updateActivity({
        details: `Watching ${movie.title}${year}`,
        state: movie.tagline || 'Enjoying a movie',
        startTimestamp: Date.now(),
        largeImageKey: getImageUrl(movie.posterPath),
        largeImageText: `${movie.title} • IMDb ${movie.voteAverage?.toFixed(1) || 'N/A'}`,
        smallImageKey: 'play',
        smallImageText: 'Streaming now'
      })
    }

    return (): void => {
      window.api?.discord?.clearActivity()
    }
  }, [movie, getImageUrl])

  if (loading) {
    return (
      <div className="space-y-8 w-full pb-16">
        <Skeleton className="h-[60vh] w-full bg-card rounded-none" />
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-8">
            <Skeleton className="h-32 w-full bg-card rounded-none" />
            <Skeleton className="h-44 w-full bg-card rounded-none" />
          </div>
          <div className="lg:col-span-4">
            <Skeleton className="h-80 w-full bg-card rounded-none" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center gap-6">
        <div className="space-y-2">
          <h4 className="text-2xl font-black text-foreground uppercase tracking-tight">
            Movie Details Unavailable
          </h4>
          <p className="text-muted-foreground">{error || 'Unable to retrieve title content.'}</p>
        </div>
        <Button
          onClick={() => navigate('/movies')}
          size="lg"
          className="rounded-none font-bold bg-primary text-primary-foreground hover:bg-primary transition-none cursor-pointer"
        >
          Return to Catalogue
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full pb-24">
      {/* 1. Cinematic Full-Bleed Hero Banner */}
      <div className="relative w-full h-[35vh] sm:h-[50vh] md:h-[65vh] min-h-64 sm:min-h-96 md:min-h-125 mb-6 md:mb-12">
        <img
          src={getImageUrl(movie.backdropPath)}
          alt={movie.title}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/20 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-r from-background/90 via-background/40 to-transparent" />

        <button
          onClick={() => navigate('/movies')}
          className="absolute top-4 left-4 md:top-8 md:left-8 z-30 flex items-center gap-1.5 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 active:scale-95 px-3.5 py-2.5 rounded-xl border border-white/10 backdrop-blur-md cursor-pointer font-bold tracking-widest text-xs uppercase transition-all duration-300"
        >
          <ChevronLeft className="size-4" /> Back
        </button>

        <div className="absolute bottom-0 left-0 w-full px-4 sm:px-8 md:px-16 pb-6 md:pb-12 z-20">
          <div className="max-w-4xl space-y-3 md:space-y-4">
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter uppercase leading-none md:leading-[0.9] wrap-break-word">
              {movie.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:text-sm md:text-base font-bold text-white/70 uppercase tracking-widest">
              <span>{movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'N/A'}</span>
              <span>&bull;</span>
              {movie.runtime && (
                <>
                  <span>
                    {Math.floor(movie.runtime / 60)}H {movie.runtime % 60}M
                  </span>
                  <span>&bull;</span>
                </>
              )}
              <span className="text-primary">{movie.genres ? movie.genres[0] : 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-16 space-y-8 md:space-y-12 lg:space-y-16">
        {/* Actions & Synopsis Row */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-10">
          {/* Left actions panel */}
          <div className="flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start gap-4 bg-card/25 border border-border p-4 md:p-5 rounded-2xl md:w-56 shrink-0">
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                IMDb Rating
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl md:text-3xl font-black text-white leading-none">
                  {movie.voteAverage?.toFixed(1) || 'N/A'}
                </span>
                <Star className="size-5 fill-primary text-primary" />
              </div>
            </div>

            <div className="flex flex-row md:flex-col gap-2.5">
              <button
                onClick={() => {
                  const playerEl = document.getElementById('cafeverse-player')
                  playerEl?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="flex items-center justify-center gap-2 bg-primary text-primary-foreground font-extrabold uppercase tracking-wider text-[10px] md:text-xs px-4 py-3 rounded-xl hover:bg-primary/95 active:scale-95 transition-all cursor-pointer min-h-11 shadow-lg shadow-primary/10 shrink-0"
              >
                <Play className="size-3.5 fill-primary-foreground text-primary-foreground" />
                Play
              </button>
              <button
                onClick={() => toggleWatchlist(movie)}
                className={`flex items-center justify-center gap-2 font-extrabold uppercase tracking-wider text-[10px] md:text-xs px-4 py-3 rounded-xl border active:scale-95 transition-all cursor-pointer min-h-11 shrink-0 ${
                  isItemInWatchlist(movie)
                    ? 'bg-primary/10 border-primary/45 text-primary'
                    : 'bg-muted/70 border-border text-foreground hover:bg-accent'
                }`}
              >
                <Star
                  className={`size-3.5 ${isItemInWatchlist(movie) ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
                />
                {isItemInWatchlist(movie) ? 'Watchlisted' : 'Watchlist'}
              </button>
            </div>
          </div>

          {/* Storyline text */}
          <div className="flex-1 space-y-4 md:space-y-6 text-left">
            <h3 className="text-xl font-black uppercase tracking-widest text-foreground">
              Storyline
            </h3>
            <p className="text-base sm:text-lg text-foreground/80 leading-relaxed font-medium">
              {movie.overview || 'No description available.'}
            </p>
            {movie.tagline && (
              <p className="text-sm sm:text-base font-bold italic text-primary/80">
                {movie.tagline}
              </p>
            )}
          </div>
        </div>

        {/* Player Embed */}
        <div id="cafeverse-player" className="space-y-6 scroll-mt-24">
          <h3 className="text-xl font-black uppercase tracking-widest text-foreground flex items-center gap-3">
            <Play className="size-5 text-primary fill-primary" />
            Now Playing
          </h3>
          <div className="relative w-full h-125 bg-card aspect-video rounded-2xl overflow-hidden border border-border">
            <iframe
              src={`https://vaplayer.ru/embed/movie/${movie.imdbId || movie.tmdbId}?color=ffe0c2&secondaryColor=393028&title=false`}
              className="absolute border-0 top-[-1%] left-[-1%] w-[102%] h-[102%]"
              allowFullScreen
              allow="fullscreen; picture-in-picture"
              sandbox="allow-scripts allow-same-origin"
              title={`Watch ${movie.title}`}
            />
          </div>
        </div>

        {/* Cast */}
        {movie.cast && movie.cast.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-xl font-black uppercase tracking-widest text-foreground">Cast</h3>
            <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
              {movie.cast.map((c, i) => (
                <div key={i} className="flex flex-col w-32 shrink-0 gap-3">
                  {c.profilePath ? (
                    <div className="w-full aspect-2/3 overflow-hidden rounded-xl bg-muted">
                      <img
                        src={getImageUrl(c.profilePath)}
                        alt={c.name}
                        className="h-full w-full object-cover grayscale opacity-80 md:hover:grayscale-0 md:hover:opacity-100 transition-all duration-300"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-2/3 bg-card flex items-center justify-center rounded-xl border border-border">
                      <span className="text-xl font-black text-muted-foreground uppercase">
                        {c.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-foreground leading-tight">
                      {c.name}
                    </span>
                    <span className="text-xs text-muted-foreground uppercase tracking-widest line-clamp-2">
                      {c.character}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
