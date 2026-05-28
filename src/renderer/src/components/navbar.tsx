import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Layers, Film, Tv, Bookmark, Menu, Coffee, RefreshCw } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

interface NavbarProps {
  watchlistCount: number
  updateAvailable?: boolean
}

interface SidebarContentProps {
  watchlistCount: number
  setOpen: (open: boolean) => void
}

const DesktopNavItem: React.FC<{
  to: string
  icon: React.ElementType
  label: string
  count?: number
  end?: boolean
}> = ({ to, icon: Icon, label, count, end }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `flex items-center gap-2 px-3 py-1.5 text-xs font-bold transition-all duration-500 relative group/nav cursor-pointer rounded-xl border border-transparent ${
        isActive
          ? 'text-primary bg-primary/[0.06] border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.05)]'
          : 'text-muted-foreground/60 hover:text-foreground hover:bg-white/[0.02]'
      }`
    }
  >
    {({ isActive }) => (
      <>
        {/* Glow Active Dock Indicator at the bottom boundary of the header */}
        {isActive && (
          <div className="absolute -bottom-[20px] left-1/2 -translate-x-1/2 w-8 h-[2px] bg-primary rounded-full shadow-[0_0_12px_rgba(var(--primary),0.9)] z-20 animate-in fade-in zoom-in duration-500" />
        )}

        <Icon
          className={`size-4 transition-all duration-500 ${
            isActive
              ? 'text-primary scale-110'
              : 'group-hover/nav:text-primary group-hover/nav:scale-110'
          }`}
        />
        <span className="tracking-tight font-extrabold">{label}</span>

        {count !== undefined && count > 0 && (
          <div
            className={`flex h-4 min-w-4 items-center justify-center rounded-md px-1 text-[8px] font-black transition-all duration-500 ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'bg-white/5 text-muted-foreground/45 group-hover/nav:bg-primary/20 group-hover/nav:text-primary'
            }`}
          >
            {count}
          </div>
        )}
      </>
    )}
  </NavLink>
)

/**
 * Vertical stacked navigation item for Mobile sidebar drawer
 */
const MobileNavItem: React.FC<{
  to: string
  icon: React.ElementType
  label: string
  count?: number
  onClick: () => void
  end?: boolean
}> = ({ to, icon: Icon, label, count, onClick, end }) => (
  <NavLink
    to={to}
    onClick={onClick}
    end={end}
    className={({ isActive }) =>
      `flex w-full items-center gap-4 px-6 py-3.5 text-sm font-bold transition-all duration-500 relative group/nav ${
        isActive ? 'text-primary' : 'text-muted-foreground/50 hover:text-foreground'
      }`
    }
  >
    {({ isActive }) => (
      <>
        {isActive && (
          <div className="absolute inset-y-0 left-0 right-4 bg-linear-to-r from-primary/[0.08] to-transparent rounded-r-2xl animate-in slide-in-from-left-2 duration-500" />
        )}
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_20px_rgba(var(--primary),0.8)] z-20" />
        )}

        <Icon
          className={`size-5 relative z-10 transition-all duration-500 ${
            isActive
              ? 'text-primary scale-110'
              : 'group-hover/nav:text-primary group-hover/nav:scale-110'
          }`}
        />
        <span className="flex-1 text-left tracking-tight font-extrabold relative z-10">
          {label}
        </span>

        {count !== undefined && count > 0 && (
          <div
            className={`relative z-10 flex h-5 min-w-5 items-center justify-center rounded-md px-1.5 text-[10px] font-black transition-all duration-500 ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'bg-white/5 text-muted-foreground/40'
            }`}
          >
            {count}
          </div>
        )}
      </>
    )}
  </NavLink>
)

const SidebarContent: React.FC<SidebarContentProps> = ({ watchlistCount, setOpen }) => (
  <div className="flex h-full flex-col bg-[#0c0a09]/95 backdrop-blur-3xl relative overflow-hidden border-r border-white/[0.02]">
    {/* Architectural Rim Light */}
    <div className="absolute inset-y-0 right-0 w-[1px] bg-linear-to-b from-transparent via-white/5 to-transparent pointer-events-none" />

    {/* Subdued Brand Glow */}
    <div className="absolute top-0 left-0 h-96 w-96 rounded-full bg-primary/[0.02] blur-[120px] pointer-events-none" />

    {/* Sidebar Header */}
    <div className="flex h-28 items-center px-8 shrink-0 relative z-10">
      <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setOpen(false)}>
        <div className="relative">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-[#1c1917] to-[#0c0a09] border border-white/[0.03] shadow-md">
            <Coffee className="size-5.5 text-primary animate-pulse" />
          </div>
        </div>
        <div className="flex flex-col">
          <h2 className="text-xl font-black tracking-tighter text-white uppercase italic select-none leading-none">
            Café<span className="text-primary not-italic">Verse</span>
          </h2>
        </div>
      </div>
    </div>

    {/* Navigation Options */}
    <nav className="flex-1 py-2 overflow-y-auto relative z-10 scrollbar-none space-y-6">
      {/* SECTION: BROWSE */}
      <div className="space-y-1">
        <div className="px-8 mb-2">
          <span className="text-[9px] font-black text-white/50 tracking-[0.3em] uppercase select-none">
            Browse
          </span>
        </div>
        <div className="space-y-0.5">
          <MobileNavItem
            to="/"
            icon={Layers}
            label="Dashboard"
            onClick={() => setOpen(false)}
            end
          />
          <MobileNavItem to="/movies" icon={Film} label="Movies" onClick={() => setOpen(false)} />
          <MobileNavItem to="/tvshows" icon={Tv} label="TV Shows" onClick={() => setOpen(false)} />
        </div>
      </div>

      {/* SECTION: COLLECTION */}
      <div className="space-y-1">
        <div className="px-8 mb-2">
          <span className="text-[9px] font-black text-white/50 tracking-[0.3em] uppercase select-none">
            Collection
          </span>
        </div>
        <div className="space-y-0.5">
          <MobileNavItem
            to="/watchlist"
            icon={Bookmark}
            label="Watchlist"
            count={watchlistCount}
            onClick={() => setOpen(false)}
          />
        </div>
      </div>
    </nav>

    {/* Footer - Pure Architectural Detail */}
    <div className="p-8 relative z-10">
      <div className="flex items-center gap-3">
        <div className="h-1 w-1 rounded-full bg-primary/20" />
        <div className="h-px flex-1 bg-linear-to-r from-white/5 to-transparent" />
      </div>
    </div>
  </div>
)

export const Navbar: React.FC<NavbarProps> = ({ watchlistCount, updateAvailable }) => {
  const [open, setOpen] = useState(false)

  return (
    <header className="h-16 w-full shrink-0 flex items-center justify-between px-8 bg-[#0c0a09]/60 backdrop-blur-3xl border-b border-white/[0.04] relative z-40 select-none">
      <NavLink to="/" className="flex items-center gap-3.5 group cursor-pointer">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-md rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-[#1c1917] to-[#0c0a09] border border-white/[0.04] shadow-lg group-hover:border-primary/20 transition-colors duration-500">
            <Coffee className="size-5.5 text-primary group-hover:scale-110 transition-transform duration-500 animate-pulse" />
          </div>
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-black tracking-tighter text-white uppercase italic select-none leading-none group-hover:text-primary transition-colors duration-500">
            Café
            <span className="text-primary not-italic group-hover:text-white transition-colors duration-500">
              Verse
            </span>
          </h1>
        </div>
      </NavLink>

      {/* 2. Navigation & Actions (Right-aligned) */}
      <div className="flex items-center gap-6 h-full">
        {/* Desktop Navigation Menu */}
        <nav className="hidden md:flex items-center gap-1.5 h-full">
          <DesktopNavItem to="/" icon={Layers} label="Dashboard" end />
          <DesktopNavItem to="/movies" icon={Film} label="Movies" />
          <DesktopNavItem to="/tvshows" icon={Tv} label="TV Shows" />
          <DesktopNavItem
            to="/watchlist"
            icon={Bookmark}
            label="Watchlist"
            count={watchlistCount}
          />
        </nav>

        {/* Actions / Utility container */}
        <div className="flex items-center gap-3">
          {updateAvailable && (
            <NavLink
              to="/update"
              className="flex items-center justify-center size-9.5 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/95 hover:scale-105 active:scale-95 transition-all duration-300 animate-pulse cursor-pointer shrink-0 shadow-lg shadow-destructive/30 group"
              title="System Update Available"
            >
              <RefreshCw className="size-4.5 group-hover:rotate-180 transition-transform duration-500" />
            </NavLink>
          )}

          <div className="md:hidden flex items-center">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-transparent border-white/10 text-foreground hover:bg-white/[0.02] cursor-pointer rounded-xl size-9.5 shrink-0 transition-colors"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="flex w-72 flex-col justify-start border-r border-border/40 bg-transparent p-0"
              >
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SidebarContent watchlistCount={watchlistCount} setOpen={setOpen} />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <div className="hidden md:block absolute bottom-0 left-0 right-0 h-[1px] bg-linear-to-r from-transparent via-primary/10 to-transparent pointer-events-none" />
    </header>
  )
}

export default Navbar
