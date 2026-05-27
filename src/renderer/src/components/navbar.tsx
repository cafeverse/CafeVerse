import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Layers, Film, Tv, Bookmark, Menu, Coffee } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

interface NavbarProps {
  watchlistCount: number
}

interface SidebarContentProps {
  watchlistCount: number
  setOpen: (open: boolean) => void
}

const SidebarContent: React.FC<SidebarContentProps> = ({ watchlistCount, setOpen }) => (
  <div className="flex h-full flex-col bg-card/90 backdrop-blur-xl relative overflow-hidden">
    {/* Glow Effects */}
    <div className="absolute -top-12 -left-12 h-36 w-36 rounded-full bg-primary/10 blur-[80px] pointer-events-none" />

    {/* Sidebar Header Brand Logo */}
    <div className="flex h-20 items-center justify-center border-b border-border px-6 gap-3 shrink-0 relative z-10">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30">
        <Coffee className="size-5 text-white" />
      </div>
      <div className="flex flex-col">
        <h2 className="m-0 text-lg font-bold tracking-wider text-primary">CaféVerse</h2>
      </div>
    </div>

    {/* Sidebar Navigation Options */}
    <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto relative z-10">
      <NavLink
        to="/"
        onClick={() => setOpen(false)}
        className={({ isActive }) =>
          `flex w-full items-center gap-3.5 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-300 group/nav ${
            isActive
              ? 'bg-primary/10 border-l-[3px] border-primary text-primary shadow-inner'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }`
        }
        end
      >
        {({ isActive }) => (
          <>
            <Layers
              className={`size-4.5 transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground group-hover/nav:text-primary'
              }`}
            />
            <span>Dashboard</span>
          </>
        )}
      </NavLink>

      <NavLink
        to="/movies"
        onClick={() => setOpen(false)}
        className={({ isActive }) =>
          `flex w-full items-center gap-3.5 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-300 group/nav ${
            isActive
              ? 'bg-primary/10 border-l-[3px] border-primary text-primary shadow-inner'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <Film
              className={`size-4.5 transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground group-hover/nav:text-primary'
              }`}
            />
            <span>Movies</span>
          </>
        )}
      </NavLink>

      <NavLink
        to="/tvshows"
        onClick={() => setOpen(false)}
        className={({ isActive }) =>
          `flex w-full items-center gap-3.5 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-300 group/nav ${
            isActive
              ? 'bg-primary/10 border-l-[3px] border-primary text-primary shadow-inner'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <Tv
              className={`size-4.5 transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground group-hover/nav:text-primary'
              }`}
            />
            <span>TV Shows</span>
          </>
        )}
      </NavLink>

      <NavLink
        to="/watchlist"
        onClick={() => setOpen(false)}
        className={({ isActive }) =>
          `flex w-full items-center gap-3.5 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-300 group/nav ${
            isActive
              ? 'bg-primary/10 border-l-[3px] border-primary text-primary shadow-inner'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <Bookmark
              className={`size-4.5 transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground group-hover/nav:text-primary'
              }`}
            />
            <span className="flex-1 text-left">My Watchlist</span>
            {watchlistCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground shadow-md shadow-primary/20">
                {watchlistCount}
              </span>
            )}
          </>
        )}
      </NavLink>
    </nav>
  </div>
)

export const Navbar: React.FC<NavbarProps> = ({ watchlistCount }) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="md:hidden flex items-center p-4 fixed top-0 left-0 z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="bg-background/80 backdrop-blur-md border-white/10 text-foreground shrink-0 cursor-pointer"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="flex w-64 flex-col justify-start border-r border-border/60 bg-transparent p-0"
          >
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SidebarContent watchlistCount={watchlistCount} setOpen={setOpen} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex relative w-64 flex-col border-r border-border/60 shrink-0 h-full">
        <SidebarContent watchlistCount={watchlistCount} setOpen={setOpen} />
      </aside>
    </>
  )
}

export default Navbar
