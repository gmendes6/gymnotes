import { useState, useRef } from 'react'
import { GripHorizontal, X } from 'lucide-react'

const PRESETS = [60, 90, 120, 180, 300]

type Props = {
  timerSec: number | null
  timerDur: number
  onSetTimer: (dur: number) => void
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

export default function FloatingTimer({ timerSec, timerDur, onSetTimer, onClose }: Props) {
  const [pos, setPos] = useState(() => ({
    x: Math.max(16, window.innerWidth - 208),
    y: Math.round(window.innerHeight * 0.55),
  }))
  const dragging = useRef(false)
  const offset = useRef({ x: 0, y: 0 })

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    dragging.current = true
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    e.currentTarget.setPointerCapture(e.pointerId)
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
  const running = timerSec !== null && timerSec > 0
  const display = timerSec === null ? fmt(timerDur) : isZero ? 'Vai!' : fmt(timerSec)

  return (
    <div
      style={{ left: pos.x, top: pos.y }}
      className={`fixed z-50 w-48 rounded-2xl border shadow-2xl shadow-black/60 select-none
        ${isZero ? 'bg-brand/25 border-brand/50' : 'bg-[#1c1c1c] border-white/12'}`}
    >
      {/* Drag handle */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="flex items-center justify-between px-3 pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
      >
        <GripHorizontal size={14} className="text-white/20 shrink-0" />
        <span className={`text-2xl font-bold tabular-nums tracking-tight
          ${isZero ? 'text-brand' : running ? 'text-white' : 'text-white/40'}`}>
          {display}
        </span>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={onClose}
          className="text-white/20 hover:text-white/70 p-0.5 shrink-0"
        >
          <X size={14} />
        </button>
      </div>

      {/* Presets */}
      <div className="flex gap-1 px-3 pb-3">
        {PRESETS.map(s => (
          <button
            key={s}
            onPointerDown={e => e.stopPropagation()}
            onClick={() => onSetTimer(s)}
            className={`flex-1 h-7 rounded-lg text-[9px] font-bold transition-colors
              ${timerDur === s && (running || isZero) ? 'bg-brand text-white' : 'bg-white/8 text-white/40'}`}
          >
            {presetLabel(s)}
          </button>
        ))}
      </div>
    </div>
  )
}
