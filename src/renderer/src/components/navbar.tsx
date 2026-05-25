import React from 'react'
import { NavLink } from 'react-router-dom'
import { Layers, Film, Tv, Bookmark } from 'lucide-react'

interface NavbarProps {
  watchlistCount: number
}

export const Navbar: React.FC<NavbarProps> = ({ watchlistCount }) => {
  return (
    <aside className="relative flex w-64 flex-col border-r border-border/60 bg-card/90 backdrop-blur-xl shrink-0">
      {/* Glow Effects */}
      <div className="absolute -top-12 -left-12 h-36 w-36 rounded-full bg-primary/10 blur-[80px]" />

      {/* Sidebar Header Brand Logo */}
      <div className="flex h-20 items-center justify-center border-b border-border px-6 gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30">
          <Layers className="size-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-wider text-primary">CINEVERSE</span>
        </div>
      </div>

      {/* Sidebar Navigation Options */}
      <nav className="flex-1 space-y-1.5 px-4 py-6">
        <NavLink
          to="/"
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
    </aside>
  )
}
export default Navbar
