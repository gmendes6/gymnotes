import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { GripHorizontal, X, Play, Pause, RotateCcw } from 'lucide-react'

const PRESETS = [120, 150, 180, 240, 300]

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
  const [pos, setPos] = useState({ x: 16, y: 140 })
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

  return createPortal(
    <div
      style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999 }}
      className={`w-56 rounded-2xl border shadow-2xl shadow-black/70 select-none
        ${isZero ? 'bg-brand border-brand/60' : 'bg-[#222] border-white/20'}`}
    >
      {/* Top row */}
      <div className="flex items-center gap-1 px-2 pt-3 pb-2">
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="touch-none cursor-grab active:cursor-grabbing p-1 shrink-0"
        >
          <GripHorizontal size={14} className="text-white/30" />
        </div>

        <span className={`flex-1 text-3xl font-bold tabular-nums tracking-tight text-center
          ${isZero ? 'text-white' : running ? 'text-white' : 'text-white/50'}`}>
          {display}
        </span>

        <button
          onClick={running ? onPause : onStart}
          className={`p-1.5 rounded-lg ${running ? 'text-white/70' : 'text-brand'}`}
        >
          {running ? <Pause size={15} /> : <Play size={15} />}
        </button>

        <button onClick={onReset} className="p-1.5 text-white/30 rounded-lg">
          <RotateCcw size={13} />
        </button>

        <button onClick={onClose} className="p-1.5 text-white/25 rounded-lg">
          <X size={13} />
        </button>
      </div>

      {/* Presets */}
      <div className="flex gap-1 px-3 pb-3">
        {PRESETS.map(s => (
          <button
            key={s}
            onClick={() => onSetDur(s)}
            className={`flex-1 h-7 rounded-lg text-[9px] font-bold
              ${timerDur === s ? 'bg-brand text-white' : 'bg-white/10 text-white/50'}`}
          >
            {presetLabel(s)}
          </button>
        ))}
      </div>
    </div>,
    document.body
  )
}
