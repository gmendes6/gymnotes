import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { GripHorizontal, X, Play, Pause, RotateCcw, ArrowDownRight } from 'lucide-react'

const PRESETS = [120, 150, 180, 240, 300]
const MIN_W = 180
const MAX_W = 360

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

function loadPos() {
  try { return JSON.parse(localStorage.getItem('gymnotes_timer_pos') || '') }
  catch { return { x: 16, y: 140 } }
}

function loadWidth() {
  const v = Number(localStorage.getItem('gymnotes_timer_w'))
  return v >= MIN_W && v <= MAX_W ? v : 224
}

export default function FloatingTimer({ timerSec, timerDur, running, onSetDur, onStart, onPause, onReset, onClose }: Props) {
  const [pos, setPos] = useState<{ x: number; y: number }>(loadPos)
  const [width, setWidth] = useState<number>(loadWidth)

  const posRef = useRef(pos)
  const widthRef = useRef(width)

  // drag state
  const dragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  // resize state
  const resizing = useRef(false)
  const resizeStart = useRef({ x: 0, w: 0 })

  /* ── drag handlers ── */
  function onDragDown(e: React.PointerEvent<HTMLDivElement>) {
    dragging.current = true
    dragOffset.current = { x: e.clientX - posRef.current.x, y: e.clientY - posRef.current.y }
    e.currentTarget.setPointerCapture(e.pointerId)
    e.preventDefault()
  }

  function onDragMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return
    const next = {
      x: Math.max(0, Math.min(window.innerWidth - widthRef.current, e.clientX - dragOffset.current.x)),
      y: Math.max(0, Math.min(window.innerHeight - 90, e.clientY - dragOffset.current.y)),
    }
    posRef.current = next
    setPos(next)
  }

  function onDragUp() {
    if (!dragging.current) return
    dragging.current = false
    localStorage.setItem('gymnotes_timer_pos', JSON.stringify(posRef.current))
  }

  /* ── resize handlers ── */
  function onResizeDown(e: React.PointerEvent<HTMLDivElement>) {
    resizing.current = true
    resizeStart.current = { x: e.clientY, w: widthRef.current }
    e.currentTarget.setPointerCapture(e.pointerId)
    e.stopPropagation()
    e.preventDefault()
  }

  function onResizeMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!resizing.current) return
    const next = Math.max(MIN_W, Math.min(MAX_W, resizeStart.current.w + (e.clientY - resizeStart.current.x)))
    widthRef.current = next
    setWidth(next)
  }

  function onResizeUp() {
    if (!resizing.current) return
    resizing.current = false
    localStorage.setItem('gymnotes_timer_w', String(widthRef.current))
  }

  const isZero = timerSec === 0
  const display = timerSec === null ? fmt(timerDur) : isZero ? 'Vai!' : fmt(timerSec)
  const timeSize = width >= 280 ? 'text-5xl' : width >= 220 ? 'text-4xl' : 'text-3xl'

  return createPortal(
    <div
      style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999, width }}
      className={`rounded-2xl border shadow-2xl shadow-black/70 select-none
        ${isZero ? 'bg-brand border-brand/60' : 'bg-[#222] border-white/20'}`}
    >
      {/* Top row: grip + time + controls */}
      <div className="flex items-center gap-1 px-2 pt-3 pb-2">
        <div
          onPointerDown={onDragDown}
          onPointerMove={onDragMove}
          onPointerUp={onDragUp}
          className="touch-none cursor-grab active:cursor-grabbing p-1 shrink-0"
        >
          <GripHorizontal size={14} className="text-white/30" />
        </div>

        <span className={`flex-1 font-bold tabular-nums tracking-tight text-center ${timeSize}
          ${isZero ? 'text-white' : running ? 'text-white' : 'text-white/50'}`}>
          {display}
        </span>

        <button onClick={running ? onPause : onStart}
          className={`p-1.5 rounded-lg shrink-0 ${running ? 'text-white/70' : 'text-brand'}`}>
          {running ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <button onClick={onReset} className="p-1.5 text-white/30 rounded-lg shrink-0">
          <RotateCcw size={13} />
        </button>
        <button onClick={onClose} className="p-1.5 text-white/25 rounded-lg shrink-0">
          <X size={13} />
        </button>
      </div>

      {/* Presets */}
      <div className="flex gap-1 px-3 pb-3">
        {PRESETS.map(s => (
          <button key={s} onClick={() => onSetDur(s)}
            className={`flex-1 h-7 rounded-lg text-[9px] font-bold
              ${timerDur === s ? 'bg-brand text-white' : 'bg-white/10 text-white/50'}`}>
            {presetLabel(s)}
          </button>
        ))}
      </div>

      {/* Resize handle — canto inferior direito */}
      <div
        onPointerDown={onResizeDown}
        onPointerMove={onResizeMove}
        onPointerUp={onResizeUp}
        className="absolute bottom-1 right-1 touch-none cursor-ns-resize p-1 text-white/30 active:text-white/70"
      >
        <ArrowDownRight size={14} />
      </div>
    </div>,
    document.body
  )
}
