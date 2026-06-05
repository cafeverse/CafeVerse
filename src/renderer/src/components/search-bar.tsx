import React from 'react'
import { Search, X } from 'lucide-react'
import type { SearchType } from '@/types'

export interface SearchBarProps {
  query: string
  onQueryChange: (q: string) => void
  type: SearchType
  onTypeChange: (t: SearchType) => void
  onClear: () => void
}

const TYPE_OPTIONS: { value: SearchType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'movie', label: 'Movies' },
  { value: 'tv', label: 'TV Shows' }
]

/**
 * Sticky global search bar — input field + type filter pills.
 * Renders at the top of DashboardPage inside a sticky section.
 */
export default function SearchBar({
  query,
  onQueryChange,
  type,
  onTypeChange,
  onClear
}: SearchBarProps): React.JSX.Element {
  return (
    <div className="flex w-full items-center gap-3">
      {/* Text input */}
      <div className="flex flex-1 md:w-96 md:flex-none items-center bg-muted/40 border border-border/40 rounded-full px-3 py-1 text-xs shadow-inner focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-200">
        <Search className="size-4 text-muted-foreground/60 mr-2 shrink-0" />
        <input
          id="global-search-input"
          type="search"
          autoComplete="off"
          placeholder="Search movies, TV shows..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          aria-label="Search CaféVerse library"
          className="flex-1 bg-transparent border-0 outline-hidden py-1.5 text-foreground placeholder-muted-foreground/60 w-full"
        />
        {query && (
          <button
            onClick={onClear}
            aria-label="Clear search"
            className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground cursor-pointer transition-colors"
          >
            <X className="size-3" />
          </button>
        )}
      </div>

      {/* Type filter pills */}
      <div className="hidden sm:flex gap-1 shrink-0">
        {TYPE_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onTypeChange(value)}
            aria-pressed={type === value}
            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase cursor-pointer transition-all duration-150 ${
              type === value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/40 text-muted-foreground/70 hover:bg-muted hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
