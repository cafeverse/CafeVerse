import React from 'react'
import { Film, Tv, PlayCircle, Star, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import type { MediaItem } from '@/types'

// ---------------------------------------------------------------------------
// SearchResultCard — single poster tile
// ---------------------------------------------------------------------------

export interface SearchResultCardProps {
  item: MediaItem
  getPosterUrl: (item: MediaItem) => string
  onClick: (item: MediaItem) => void
}

export function SearchResultCard({
  item,
  getPosterUrl,
  onClick
}: SearchResultCardProps): React.JSX.Element {
  const poster = getPosterUrl(item)
  const year = item.releaseDate
    ? new Date(item.releaseDate).getFullYear()
    : item.firstAirDate
      ? new Date(item.firstAirDate).getFullYear()
      : null

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(item)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(item)
        }
      }}
      aria-label={`${item.title || item.name}, ${item.contentType === 'movie' ? 'Movie' : 'TV Show'}`}
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-border/40 hover:border-primary/20 bg-muted/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {/* Poster area */}
      <div className="aspect-2/3 w-full overflow-hidden bg-muted relative">
        {poster ? (
          <img
            src={poster}
            alt={item.title || item.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-linear-to-br from-muted/50 to-background flex flex-col items-center justify-center p-3 text-center">
            {item.contentType === 'movie' ? (
              <Film className="size-8 text-muted-foreground/35 mb-2" />
            ) : (
              <Tv className="size-8 text-muted-foreground/35 mb-2" />
            )}
            <span className="text-[10px] font-black tracking-tight text-muted-foreground/75 truncate w-full">
              {item.title || item.name}
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
          <PlayCircle className="size-11 text-primary drop-shadow-md" />
        </div>

        {/* Rating badge */}
        <Badge className="absolute top-2.5 right-2.5 bg-black/70 border border-white/10 text-[9px] font-black text-amber-400 gap-1 rounded-md px-1.5 py-0.5">
          <Star className="size-2.5 fill-amber-400 stroke-none" />
          <span>{item.voteAverage?.toFixed(1) || '0.0'}</span>
        </Badge>

        {/* Content-type badge */}
        <Badge className="absolute bottom-2.5 left-2.5 bg-primary border-none text-[8px] font-black text-primary-foreground uppercase tracking-widest px-1.5 py-0.5 rounded-md">
          {item.contentType === 'movie' ? 'Movie' : 'TV Show'}
        </Badge>
      </div>

      {/* Caption */}
      <div className="p-3">
        <h3 className="font-extrabold text-xs tracking-tight text-foreground leading-tight truncate group-hover:text-primary transition-colors">
          {item.title || item.name}
        </h3>
        {year && <p className="text-[9px] text-muted-foreground/60 mt-1">{year}</p>}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SearchResultsPanel — full results overlay section
// ---------------------------------------------------------------------------

export interface SearchResultsPanelProps {
  query: string
  results: MediaItem[]
  isSearching: boolean
  getPosterUrl: (item: MediaItem) => string
  onItemClick: (item: MediaItem) => void
}

const SKELETON_COUNT = 6

export function SearchResultsPanel({
  query,
  results,
  isSearching,
  getPosterUrl,
  onItemClick
}: SearchResultsPanelProps): React.JSX.Element | null {
  if (!query) return null

  return (
    <section
      aria-label={`Search results for "${query}"`}
      className="px-8 mt-4 animate-in fade-in slide-in-from-top-4 duration-300"
    >
      {/* Panel header */}
      <div className="flex items-center justify-between mb-4 border-b border-border/30 pb-2">
        <h2 className="text-sm font-black tracking-tight text-foreground flex items-center gap-2">
          <span>
            Results for <span className="text-primary">&ldquo;{query}&rdquo;</span>
          </span>
          {!isSearching && results.length > 0 && (
            <span className="text-[10px] font-bold text-muted-foreground/60">
              ({results.length} found)
            </span>
          )}
        </h2>
      </div>

      {/* Content states */}
      {isSearching ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-2/3 w-full rounded-xl bg-muted" />
              <Skeleton className="h-4 w-3/4 bg-muted" />
              <Skeleton className="h-3 w-1/2 bg-muted" />
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-muted/10 border border-border/20 rounded-2xl text-center">
          <AlertTriangle className="size-10 text-amber-500/60 mb-3" />
          <p className="text-sm font-bold text-foreground mb-1">No matches found.</p>
          <p className="text-xs text-muted-foreground/60 max-w-sm">
            Try a different title, or check back once new content is added.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {results.map((item) => (
            <SearchResultCard
              key={`${item.contentType}-${item.id}`}
              item={item}
              getPosterUrl={getPosterUrl}
              onClick={onItemClick}
            />
          ))}
        </div>
      )}

      <Separator className="bg-border/30 my-8" />
    </section>
  )
}
