import React from 'react'
import { HeartOff, Star, X, Bookmark } from 'lucide-react'
import { MediaItem } from '@/types'
import { useNavigate } from 'react-router-dom'

interface WatchlistProps {
  watchlist: MediaItem[]
  setWatchlist: React.Dispatch<React.SetStateAction<MediaItem[]>>
  toggleWatchlist: (item: MediaItem) => void
  getImageUrl: (path?: string) => string
  getSlug: (title?: string) => string
}

export const Watchlist: React.FC<WatchlistProps> = ({
  watchlist,
  setWatchlist,
  toggleWatchlist,
  getImageUrl,
  getSlug
}) => {
  const navigate = useNavigate()

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Bookmarked items are saved locally to your device storage. Perfect for planning your next
          stream session.
        </p>
        {watchlist.length > 0 && (
          <button
            onClick={() => setWatchlist([])}
            className="text-xs font-bold text-destructive hover:text-destructive/80 flex items-center gap-1 border border-destructive/20 bg-destructive/5 px-3 py-1.5 rounded-lg cursor-pointer"
          >
            <HeartOff className="size-3.5" /> Clear All Bookmarks
          </button>
        )}
      </div>

      {watchlist.length > 0 ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {watchlist.map((item) => (
            <div
              key={`${item.contentType}-${item.id}`}
              onClick={() => {
                if (item.contentType === 'movie') {
                  navigate('/movies/' + (item.slug || getSlug(item.title || item.name)))
                }
              }}
              className="group flex flex-col gap-3 rounded-2xl bg-background/40 border border-border p-3 transition-all duration-300 hover:bg-card/60 hover:-translate-y-1.5 hover:shadow-2xl relative cursor-pointer"
            >
              <div className="relative aspect-2/3 overflow-hidden rounded-xl bg-muted">
                <img
                  src={getImageUrl(item.posterPath)}
                  alt={item.title || item.name}
                  className="h-full w-full object-cover transition-all duration-500 group-hover:scale-105"
                />
                <div className="absolute top-2.5 right-2.5 flex h-7 items-center gap-0.5 rounded-lg bg-card/85 px-2 text-xs font-bold text-primary border border-border/80 backdrop-blur-sm shadow-md">
                  <Star className="size-3.5 fill-primary text-primary" />
                  {item.voteAverage?.toFixed(1) || 'N/A'}
                </div>
              </div>

              {/* Detail text */}
              <div className="flex flex-col px-1">
                <h4 className="text-sm font-bold text-foreground line-clamp-1 truncate transition-colors">
                  {item.title || item.name}
                </h4>
                <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold mt-1">
                  <span className="uppercase tracking-widest text-[9px] text-primary">
                    {item.contentType}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation() // Prevent navigating to detail page on removal!
                      toggleWatchlist(item)
                    }}
                    className="text-[10px] font-bold text-destructive hover:text-destructive/80 flex items-center gap-0.5 cursor-pointer"
                  >
                    <X className="size-3" /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-28 text-center gap-3 bg-card/20 border border-dashed border-border rounded-2xl">
          <Bookmark className="size-10 text-muted-foreground animate-pulse" />
          <h4 className="text-base font-bold text-foreground">Your Watchlist is empty</h4>
          <p className="text-sm text-muted-foreground max-w-sm">
            Tap the heart/bookmark icons while browsing to accumulate your favorite films and TV
            series right here.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => navigate('/movies')}
              className="px-4 py-2 bg-primary hover:bg-primary/95 rounded-xl text-xs font-bold text-primary-foreground transition-all shadow-md cursor-pointer"
            >
              Browse Movies
            </button>
            <button
              onClick={() => navigate('/tvshows')}
              className="px-4 py-2 bg-card border border-border hover:bg-accent rounded-xl text-xs font-bold text-foreground transition-all cursor-pointer"
            >
              Browse TV Shows
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
