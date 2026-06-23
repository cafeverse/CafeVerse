import React from 'react'
import { SlidersHorizontal, X, Sparkles } from 'lucide-react'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import type { SortOption } from '@/types'

// ─── Sub-components ──────────────────────────────────────────────────────────

function GenreChip({
  label,
  active,
  onClick
}: {
  label: string
  active: boolean
  onClick: () => void
}): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all duration-200 border select-none whitespace-nowrap ${
        active
          ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20'
          : 'bg-muted/40 text-muted-foreground/70 border-border/30 hover:bg-muted hover:text-white hover:border-border/60'
      }`}
    >
      {label}
    </button>
  )
}

function SortButton({
  label,
  active,
  onClick
}: {
  label: string
  active: boolean
  onClick: () => void
}): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-[10px] font-black cursor-pointer transition-all duration-200 border select-none whitespace-nowrap ${
        active
          ? 'bg-primary/15 text-primary border-primary/30'
          : 'bg-muted/30 text-muted-foreground/60 border-border/20 hover:bg-muted/60 hover:text-white'
      }`}
    >
      {label}
    </button>
  )
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface GenreFilterProps {
  /** List of available genre names */
  genres: string[]
  /** Currently selected genres */
  selectedGenres: string[]
  /** Called when the user picks a genre (null = "All") */
  onGenreChange: (genre: string | null) => void
  /** Available sort presets */
  sortOptions: SortOption[]
  /** Currently active sort option */
  activeSortOption: SortOption
  /** Called when the user picks a sort preset */
  onSortChange: (option: SortOption) => void
  /** Label shown in the catalogue heading, e.g. "Movies" or "Anime" */
  contentLabel: string
  /** Total item count from pagination (optional) */
  totalItems?: number
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function GenreFilter({
  genres,
  selectedGenres,
  onGenreChange,
  sortOptions,
  activeSortOption,
  onSortChange,
  contentLabel,
  totalItems
}: GenreFilterProps): React.JSX.Element {
  return (
    <>
      {/* ── Sticky sort bar ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 px-6 py-3.5 backdrop-blur-xl bg-background/60 border-b border-border/30 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 ml-auto flex-wrap">
          <SlidersHorizontal className="size-3.5 text-muted-foreground/40 shrink-0" />
          <span className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest hidden sm:block">
            Sort:
          </span>
          {sortOptions.map((opt) => (
            <SortButton
              key={opt.label}
              label={opt.label}
              active={activeSortOption.key === opt.key && activeSortOption.order === opt.order}
              onClick={() => onSortChange(opt)}
            />
          ))}
        </div>
      </div>

      {/* ── Genre pills (scrollable) ─────────────────────────────────────── */}
      {genres.length > 0 && (
        <section className="px-6 pt-5">
          <ScrollArea className="w-full whitespace-nowrap pb-2.5">
            <div className="flex gap-2 pb-1">
              <GenreChip
                label="All"
                active={selectedGenres.length === 0}
                onClick={() => onGenreChange(null)}
              />
              {genres.map((g) => (
                <GenreChip
                  key={g}
                  label={g}
                  active={selectedGenres.includes(g)}
                  onClick={() => onGenreChange(g)}
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="bg-muted/10" />
          </ScrollArea>
        </section>
      )}

      {/* ── Catalogue heading ────────────────────────────────────────────── */}
      <section className="px-6 pt-6 pb-3 flex items-center justify-between">
        <h2 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          {selectedGenres.length > 0
            ? `${selectedGenres.join(' + ')} ${contentLabel}`
            : `All ${contentLabel}`}
          {totalItems != null && (
            <span className="text-[10px] text-muted-foreground/40 font-bold ml-1">
              ({totalItems.toLocaleString()})
            </span>
          )}
        </h2>
        {selectedGenres.length > 0 && (
          <button
            onClick={() => onGenreChange(null)}
            className="text-[10px] text-muted-foreground/50 hover:text-white font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <X className="size-3" /> Clear filter
          </button>
        )}
      </section>
    </>
  )
}
