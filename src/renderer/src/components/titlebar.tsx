import React from 'react'
import { Minus, Square, X } from 'lucide-react'

const Titlebar: React.FC = () => {
  return (
    <div className="h-10 w-full flex items-center justify-between bg-[#0c0a09]/80 backdrop-blur-xl border-b border-white/2 select-none relative z-50">
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
          onClick={() => window.api?.windowControls?.minimize()}
          className="h-full px-4 flex items-center justify-center text-muted-foreground/40 hover:bg-white/5 hover:text-foreground cursor-pointer group"
          title="Minimize"
        >
          <Minus className="size-3.5" />
        </button>
        <button
          onClick={() => window.api?.windowControls?.maximize()}
          className="h-full px-4 flex items-center justify-center text-muted-foreground/40 hover:bg-white/5 hover:text-foreground cursor-pointer group"
          title="Maximize"
        >
          <Square className="size-3" />
        </button>
        <button
          onClick={() => window.api?.windowControls?.close()}
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
