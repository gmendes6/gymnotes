import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { GripHorizontal, X, Play, Pause, RotateCcw, ArrowDownRight } from 'lucide-react'

const PRESETS = [120, 150, 180, 240, 300]
const BASE_W = 224
const MIN_SCALE = 0.7
const MAX_SCALE = 2.2

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

function loadScale() {
  const v = Number(localStorage.getItem('gymnotes_timer_scale'))
  return v >= MIN_SCALE && v <= MAX_SCALE ? v : 1
}

export default function FloatingTimer({ timerSec, timerDur, running, onSetDur, onStart, onPause, onReset, onClose }: Props) {
  const [pos, setPos] = useState<{ x: number; y: number }>(loadPos)
  const [scale, setScale] = useState<number>(loadScale)

  const posRef = useRef(pos)
  const scaleRef = useRef(scale)

  const dragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  const resizing = useRef(false)
  const resizeStart = useRef({ x: 0, y: 0, scale: 1 })

  /* ── drag ── */
  function onDragDown(e: React.PointerEvent<HTMLDivElement>) {
    dragging.current = true
    dragOffset.current = { x: e.clientX - posRef.current.x, y: e.clientY - posRef.current.y }
    e.currentTarget.setPointerCapture(e.pointerId)
    e.preventDefault()
  }
  function onDragMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return
    const next = {
      x: Math.max(0, Math.min(window.innerWidth - BASE_W, e.clientX - dragOffset.current.x)),
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

  /* ── resize ── */
  function onResizeDown(e: React.PointerEvent<HTMLDivElement>) {
    resizing.current = true
    resizeStart.current = { x: e.clientX, y: e.clientY, scale: scaleRef.current }
    e.currentTarget.setPointerCapture(e.pointerId)
    e.stopPropagation()
    e.preventDefault()
  }
  function onResizeMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!resizing.current) return
    // diagonal distance: down-right = positive = grow, up-left = negative = shrink
    const diag = (e.clientX - resizeStart.current.x) + (e.clientY - resizeStart.current.y)
    const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, resizeStart.current.scale + diag / (BASE_W * 1.5)))
    scaleRef.current = next
    setScale(next)
  }
  function onResizeUp() {
    if (!resizing.current) return
    resizing.current = false
    localStorage.setItem('gymnotes_timer_scale', String(scaleRef.current))
  }

  const isZero = timerSec === 0
  const display = timerSec === null ? fmt(timerDur) : isZero ? 'Vai!' : fmt(timerSec)

  return createPortal(
    <div
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        zIndex: 9999,
        width: BASE_W,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
      className={`rounded-2xl border shadow-2xl shadow-black/70 select-none
        ${isZero ? 'bg-brand border-brand/60' : 'bg-[#222] border-white/20'}`}
    >
      {/* Controls row */}
      <div className="flex items-center justify-between px-2 pt-2 pb-0">
        <div
          onPointerDown={onDragDown}
          onPointerMove={onDragMove}
          onPointerUp={onDragUp}
          className="touch-none cursor-grab active:cursor-grabbing p-1 shrink-0"
        >
          <GripHorizontal size={11} className="text-white/25" />
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={running ? onPause : onStart}
            className={`p-1 rounded-md shrink-0 ${running ? 'text-white/60' : 'text-brand'}`}>
            {running ? <Pause size={12} /> : <Play size={12} />}
          </button>
          <button onClick={onReset} className="p-1 text-white/25 rounded-md shrink-0">
            <RotateCcw size={11} />
          </button>
          <button onClick={onClose} className="p-1 text-white/20 rounded-md shrink-0">
            <X size={11} />
          </button>
        </div>
      </div>

      {/* Big timer */}
      <div className="px-2 py-1 text-center">
        <span className={`text-6xl font-bold tabular-nums tracking-tight leading-none
          ${isZero ? 'text-white' : running ? 'text-white' : 'text-white/55'}`}>
          {display}
        </span>
      </div>

      {/* Presets */}
      <div className="flex gap-1 px-2 pb-3">
        {PRESETS.map(s => (
          <button key={s} onClick={() => onSetDur(s)}
            className={`flex-1 h-5 rounded text-[8px] font-bold
              ${timerDur === s ? 'bg-brand text-white' : 'bg-white/10 text-white/40'}`}>
            {presetLabel(s)}
          </button>
        ))}
      </div>

      {/* Resize handle */}
      <div
        data-resize
        onPointerDown={onResizeDown}
        onPointerMove={onResizeMove}
        onPointerUp={onResizeUp}
        className="absolute bottom-1 right-1 touch-none cursor-nwse-resize p-1.5 text-white/25 active:text-white/70"
      >
        <ArrowDownRight size={13} />
      </div>
    </div>,
    document.body
  )
}
