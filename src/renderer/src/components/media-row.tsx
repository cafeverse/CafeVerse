import React, { useRef } from 'react'
import { LucideIcon, ChevronLeft, ChevronRight, FolderOpen, PlayCircle, Star } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { MediaItem } from '@/types'

export interface MediaRowProps {
  title: string
  icon: LucideIcon
  data: MediaItem[]
  isLoading?: boolean
  error?: string | null
  onItemClick: (item: MediaItem) => void
  getPosterUrl: (item: MediaItem) => string
}

export default function MediaRow({
  title,
  icon: Icon,
  data,
  isLoading = false,
  error = null,
  onItemClick,
  getPosterUrl
}: MediaRowProps): React.JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScroll = (direction: 'left' | 'right'): void => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        const scrollAmount = direction === 'left' ? -400 : 400
        scrollContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' })
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-border/20 pb-2">
        <h3 className="text-sm font-black tracking-[0.2em] text-white/55 uppercase select-none flex items-center gap-2">
          <Icon className="size-4.5 text-primary" />
          <span>{title}</span>
        </h3>

        {!isLoading && !error && data.length > 5 && (
          <div className="flex gap-1.5">
            <button
              onClick={() => handleScroll('left')}
              aria-label={`Scroll ${title} left`}
              className="p-1 rounded-lg bg-muted/40 hover:bg-muted border border-border/30 text-muted-foreground hover:text-white cursor-pointer transition-colors"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              onClick={() => handleScroll('right')}
              aria-label={`Scroll ${title} right`}
              className="p-1 rounded-lg bg-muted/40 hover:bg-muted border border-border/30 text-muted-foreground hover:text-white cursor-pointer transition-colors"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-44 shrink-0 space-y-2">
              <Skeleton className="aspect-2/3 w-full rounded-xl bg-muted/20" />
              <Skeleton className="h-3 w-3/4 bg-muted/20" />
              <Skeleton className="h-2 w-1/2 bg-muted/20" />
            </div>
          ))}
        </div>
      ) : error || data.length === 0 ? (
        <div className="py-12 border border-dashed border-border/20 rounded-2xl flex flex-col justify-center items-center text-center p-6 bg-muted/5">
          <FolderOpen className="size-8 text-muted-foreground/30 mb-2 animate-pulse" />
          <p className="text-xs font-bold text-muted-foreground/60">
            No titles added to your library yet.
          </p>
          <p className="text-[10px] text-muted-foreground/45 mt-0.5">
            Check back later once new titles are added to the library.
          </p>
        </div>
      ) : (
        <div ref={scrollRef} className="relative">
          <ScrollArea className="w-full whitespace-nowrap rounded-2xl pb-4">
            <div className="flex gap-4">
              {data.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  className="inline-block w-44 shrink-0 cursor-pointer group bg-muted/20 border border-border/40 hover:border-primary/20 rounded-xl overflow-hidden shadow-2xs hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="aspect-2/3 w-full bg-muted relative overflow-hidden">
                    {getPosterUrl(item) ? (
                      <img
                        src={getPosterUrl(item)}
                        alt={item.title || item.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full bg-linear-to-br from-muted/50 to-background flex items-center justify-center p-3 text-center">
                        <span className="text-[10px] font-black text-muted-foreground/75 truncate w-full">
                          {item.title || item.name}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                      <PlayCircle className="size-10 text-primary drop-shadow-md" />
                    </div>
                    <Badge className="absolute top-2 right-2 bg-black/70 border border-white/10 text-[8px] font-black text-amber-400 gap-0.5 rounded-md px-1.5 py-0.5">
                      <Star className="size-2 fill-amber-400 stroke-none" />
                      <span>{item.voteAverage?.toFixed(1) || '0.0'}</span>
                    </Badge>
                  </div>
                  <div className="p-2.5">
                    <h4 className="font-extrabold text-[11px] tracking-tight text-white leading-tight truncate group-hover:text-primary transition-colors">
                      {item.title || item.name}
                    </h4>
                    <span className="text-[8px] text-muted-foreground/50 mt-0.5 block uppercase tracking-widest font-black">
                      {item.contentType === 'movie' ? 'Movie' : 'TV Show'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
