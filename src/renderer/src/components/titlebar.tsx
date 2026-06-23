import React, { useEffect } from 'react'
import { Minus, Square, X, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const Titlebar: React.FC = () => {
  const navigate = useNavigate()

  const handleBack = (): void => {
    navigate(-1)
  }

  const handleForward = (): void => {
    navigate(1)
  }

  const handleRefresh = (hard: boolean = false): void => {
    if (hard) {
      // Bypassing cache if supported/triggered

      window.location.reload()
    } else {
      window.location.reload()
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Navigation shortcuts
      if (e.altKey) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          navigate(-1)
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          navigate(1)
        }
      }

      // Refresh shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') {
        e.preventDefault()
        handleRefresh(e.shiftKey)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  useEffect(() => {
    console.log('Titlebar component mounted. window.api status:', {
      hasApi: !!window.api,
      hasWindowControls: !!window.api?.windowControls,
      hasMinimize: !!window.api?.windowControls?.minimize,
      hasMaximize: !!window.api?.windowControls?.maximize,
      hasClose: !!window.api?.windowControls?.close
    })
  }, [])

  return (
    <div className="h-10 w-full flex items-center justify-between bg-card/80 backdrop-blur-xl border-b border-border/40 select-none relative z-50">
      {/* Navigation Controls */}
      <div
        className="flex items-center h-full no-drag pl-3 gap-0.5"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={handleBack}
          className="size-6 rounded-md flex items-center justify-center text-muted-foreground/50 hover:bg-white/5 hover:text-foreground cursor-pointer transition-colors duration-150"
          title="Go Back (Alt + Left Arrow)"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          onClick={handleForward}
          className="size-6 rounded-md flex items-center justify-center text-muted-foreground/50 hover:bg-white/5 hover:text-foreground cursor-pointer transition-colors duration-150"
          title="Go Forward (Alt + Right Arrow)"
        >
          <ChevronRight className="size-4" />
        </button>
        <button
          onClick={(e) => handleRefresh(e.shiftKey)}
          className="size-6 rounded-md flex items-center justify-center text-muted-foreground/50 hover:bg-white/5 hover:text-foreground cursor-pointer transition-colors duration-150 ml-1"
          title="Refresh (Ctrl + R)"
        >
          <RotateCw className="size-3.5" />
        </button>
      </div>

      {/* Draggable Area */}
      <div
        className="flex-1 h-full flex items-center px-4"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">
          CaféVerse
        </span>
      </div>

      {/* Window Controls */}
      <div
        className="flex items-center h-full no-drag"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={() => {
            console.log('Minimize clicked')
            if (window.api?.windowControls?.minimize) {
              window.api.windowControls.minimize()
            } else {
              console.error('Minimize API missing')
            }
          }}
          className="h-full px-4 flex items-center justify-center text-muted-foreground/40 hover:bg-white/5 hover:text-foreground cursor-pointer group"
          title="Minimize"
        >
          <Minus className="size-3.5" />
        </button>
        <button
          onClick={() => {
            console.log('Maximize clicked')
            if (window.api?.windowControls?.maximize) {
              window.api.windowControls.maximize()
            } else {
              console.error('Maximize API missing')
            }
          }}
          className="h-full px-4 flex items-center justify-center text-muted-foreground/40 hover:bg-white/5 hover:text-foreground cursor-pointer group"
          title="Maximize"
        >
          <Square className="size-3" />
        </button>
        <button
          onClick={() => {
            console.log('Close clicked')
            if (window.api?.windowControls?.close) {
              window.api.windowControls.close()
            } else {
              console.error('Close API missing')
            }
          }}
          className="h-full px-5 flex items-center justify-center text-muted-foreground/40 hover:bg-destructive hover:text-white cursor-pointer group"
          title="Close"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}

export default Titlebar
