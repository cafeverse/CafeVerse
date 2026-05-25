import React from 'react'
import { Flame, Star, Calendar, Heart, TrendingUp, ChevronRight, Play } from 'lucide-react'
import { MediaItem } from '@/types'
import { useNavigate } from 'react-router-dom'

interface DashboardProps {
  featuredItem: MediaItem | null
  recentTrending: MediaItem[]
  getImageUrl: (path?: string) => string
  toggleWatchlist: (item: MediaItem) => void
  isItemInWatchlist: (item: MediaItem) => boolean
  getSlug: (title?: string) => string
}

export const Dashboard: React.FC<DashboardProps> = ({
  featuredItem,
  recentTrending,
  getImageUrl,
  toggleWatchlist,
  isItemInWatchlist,
  getSlug
}) => {
  const navigate = useNavigate()

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Hero Billboard Section */}
      {featuredItem && (
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/60 shadow-2xl">
          {/* Image Backdrop with flat dark masking */}
          <div className="absolute inset-0 z-0">
            <img
              src={getImageUrl(featuredItem.backdropPath)}
              alt={featuredItem.title || featuredItem.name}
              className="h-full w-full object-cover opacity-35 transition-all duration-700 hover:scale-102"
            />
            <div className="absolute inset-0 bg-background/70 z-10" />
          </div>

          <div className="relative z-20 max-w-2xl px-8 py-14 sm:px-12 flex flex-col items-start gap-4">
            <div className="flex items-center gap-2.5 rounded-full bg-primary/20 px-3.5 py-1 text-xs font-bold text-primary border border-primary/30">
              <Flame className="size-3 text-primary" />
              <span>FEATURED RELEASE</span>
            </div>

            <h2 className="text-4xl font-extrabold tracking-tight text-foreground md:text-5xl leading-tight">
              {featuredItem.title || featuredItem.name}
            </h2>

            {featuredItem.tagline && (
              <p className="text-sm font-semibold italic text-primary/90 tracking-wide">
                &ldquo;{featuredItem.tagline}&rdquo;
              </p>
            )}

            <p className="text-sm text-foreground/95 leading-relaxed line-clamp-3">
              {featuredItem.overview}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-muted-foreground mt-2">
              <span className="flex items-center gap-1 bg-muted/65 border border-border px-2.5 py-1 rounded-md text-primary font-bold">
                <Star className="size-3.5 fill-primary text-primary" />{' '}
                {featuredItem.voteAverage?.toFixed(1) || 'N/A'} Score
              </span>
              {featuredItem.releaseDate && (
                <span className="flex items-center gap-1 bg-muted/60 border border-border px-2.5 py-1 rounded-md">
                  <Calendar className="size-3.5" />{' '}
                  {new Date(featuredItem.releaseDate).getFullYear()}
                </span>
              )}
              {featuredItem.genres &&
                featuredItem.genres.slice(0, 3).map((g) => (
                  <span
                    key={g}
                    className="bg-primary/10 border border-primary/20 text-primary px-2.5 py-1 rounded-md"
                  >
                    {g}
                  </span>
                ))}
            </div>

            <div className="flex items-center gap-4 mt-6">
              <button
                onClick={() =>
                  navigate(
                    '/movies/' +
                      (featuredItem.slug || getSlug(featuredItem.title || featuredItem.name))
                  )
                }
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-primary/40 hover:scale-103 active:scale-98 transition-all duration-300 cursor-pointer"
              >
                <Play className="size-4 fill-primary-foreground" />
                <span>Stream Details</span>
              </button>

              <button
                onClick={() => toggleWatchlist(featuredItem)}
                className={`flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold transition-all duration-300 active:scale-98 cursor-pointer ${
                  isItemInWatchlist(featuredItem)
                    ? 'border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20'
                    : 'border-border bg-card/60 text-foreground hover:bg-accent'
                }`}
              >
                <Heart
                  className={`size-4 ${
                    isItemInWatchlist(featuredItem)
                      ? 'fill-destructive text-destructive'
                      : 'text-muted-foreground'
                  }`}
                />
                <span>{isItemInWatchlist(featuredItem) ? 'Watchlisted' : 'Add Watchlist'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HORIZONTAL TRENDING SLIDERS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <TrendingUp className="text-primary size-5" /> Database Highlights
          </h3>
          <button
            onClick={() => navigate('/movies')}
            className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors cursor-pointer"
          >
            Explore Full Library <ChevronRight className="size-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {recentTrending.length > 0 ? (
            recentTrending.map((item) => (
              <div
                key={item.id}
                onClick={() =>
                  navigate('/movies/' + (item.slug || getSlug(item.title || item.name)))
                }
                className="group flex flex-col gap-2 rounded-xl bg-card/45 border border-border p-2.5 transition-all duration-300 hover:bg-accent/60 hover:-translate-y-1.5 hover:shadow-xl cursor-pointer"
              >
                <div className="relative aspect-2/3 overflow-hidden rounded-lg bg-muted">
                  <img
                    src={getImageUrl(item.posterPath)}
                    alt={item.title || item.name}
                    className="h-full w-full object-cover transition-all duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2 flex h-7 items-center gap-0.5 rounded-md bg-card/85 px-1.5 text-[11px] font-bold text-primary border border-border/80 backdrop-blur-sm shadow-md">
                    <Star className="size-3 fill-primary text-primary" />
                    {item.voteAverage?.toFixed(1) || 'N/A'}
                  </div>
                </div>

                <div className="flex flex-col gap-1 px-1">
                  <h4 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                    {item.title || item.name}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                    <span>
                      {item.releaseDate
                        ? new Date(item.releaseDate).getFullYear()
                        : item.firstAirDate
                          ? new Date(item.firstAirDate).getFullYear()
                          : 'Series'}
                    </span>
                    <span className="uppercase tracking-widest text-primary">
                      {item.contentType}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-muted-foreground border border-dashed border-border rounded-xl bg-card/20">
              No titles detected in database. Complete migrations to populate!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
