import { useState, useRef } from 'react'
import { GripHorizontal, X, Play, Pause, RotateCcw } from 'lucide-react'

const PRESETS = [60, 90, 120, 180, 300]

type Props = {
  timerSec: number | null
  timerDur: number
  running: boolean
  onSetDur: (dur: number) => void
  onStart: () => void
  onPause: () => void
  onReset: () => void
  onClose: () => void
}

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function presetLabel(s: number) {
  if (s < 60) return `${s}s`
  if (s % 60 === 0) return `${s / 60}m`
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export default function FloatingTimer({ timerSec, timerDur, running, onSetDur, onStart, onPause, onReset, onClose }: Props) {
  const [pos, setPos] = useState(() => ({
    x: Math.max(16, window.innerWidth - 208),
    y: Math.round(window.innerHeight * 0.5),
  }))
  const dragging = useRef(false)
  const offset = useRef({ x: 0, y: 0 })

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    dragging.current = true
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    e.currentTarget.setPointerCapture(e.pointerId)
    e.preventDefault()
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - 192, e.clientX - offset.current.x)),
      y: Math.max(0, Math.min(window.innerHeight - 90, e.clientY - offset.current.y)),
    })
  }

  function onPointerUp() {
    dragging.current = false
  }

  const isZero = timerSec === 0
  const display = timerSec === null ? fmt(timerDur) : isZero ? 'Vai!' : fmt(timerSec)

  return (
    <div
      style={{ left: pos.x, top: pos.y }}
      className={`fixed z-50 w-48 rounded-2xl border shadow-2xl shadow-black/60 select-none
        ${isZero ? 'bg-brand/25 border-brand/50' : 'bg-[#1c1c1c] border-white/12'}`}
    >
      {/* Top row */}
      <div className="flex items-center gap-1 px-2 pt-3 pb-2">
        {/* Grip — único elemento arrastável */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="touch-none cursor-grab active:cursor-grabbing p-1 shrink-0"
        >
          <GripHorizontal size={14} className="text-white/20" />
        </div>

        {/* Tempo */}
        <span className={`flex-1 text-xl font-bold tabular-nums tracking-tight text-center
          ${isZero ? 'text-brand' : running ? 'text-white' : 'text-white/50'}`}>
          {display}
        </span>

        {/* Play / Pause */}
        <button
          onClick={running ? onPause : onStart}
          className={`p-1.5 rounded-lg transition-colors ${running ? 'text-white/60 hover:text-white' : 'text-brand hover:text-brand/80'}`}
        >
          {running ? <Pause size={15} /> : <Play size={15} />}
        </button>

        {/* Reset */}
        <button onClick={onReset} className="p-1.5 text-white/25 hover:text-white/60 rounded-lg">
          <RotateCcw size={13} />
        </button>

        {/* Fechar */}
        <button onClick={onClose} className="p-1.5 text-white/20 hover:text-white/60 rounded-lg">
          <X size={13} />
        </button>
      </div>

      {/* Presets */}
      <div className="flex gap-1 px-3 pb-3">
        {PRESETS.map(s => (
          <button
            key={s}
            onClick={() => onSetDur(s)}
            className={`flex-1 h-7 rounded-lg text-[9px] font-bold transition-colors
              ${timerDur === s ? 'bg-brand text-white' : 'bg-white/8 text-white/40'}`}
          >
            {presetLabel(s)}
          </button>
        ))}
      </div>
    </div>
  )
}
