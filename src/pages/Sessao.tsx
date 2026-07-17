import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, Check, Pencil, X, Timer, GripVertical } from 'lucide-react'
import FloatingTimer from '../components/FloatingTimer'
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { getTreinos, saveTreinos, uid } from '../store'
import type { Sessao as SessaoType } from '../types'

function SortableExWrapper({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="bg-[#1a1a1a] border border-white/8 rounded-2xl overflow-hidden flex"
    >
      <button
        {...attributes}
        {...listeners}
        className="touch-none flex items-start pt-4 pl-2 pr-0.5 text-white/15 cursor-grab active:cursor-grabbing shrink-0"
      >
        <GripVertical size={15} />
      </button>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

function fmtDia(s: SessaoType) {
  const d = new Date(s.data)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${s.dia.slice(0, 3)}, ${dd}/${mm}`
}

type SerieInput = { carga: string; reps: string }

function emptyInputs(n: number): SerieInput[] {
  return Array.from({ length: n }, () => ({ carga: '', reps: '' }))
}

export default function Sessao() {
  const { id, sessaoId } = useParams<{ id: string; sessaoId: string }>()
  const nav = useNavigate()
  const [treinos, setTreinos] = useState(getTreinos)
  const [openEx, setOpenEx] = useState<string | null>(null)
  const [qtd, setQtd] = useState(1)
  const [inputs, setInputs] = useState<SerieInput[]>(emptyInputs(1))
  const [obs, setObs] = useState('')
  const [mesmaCarga, setMesmaCarga] = useState(false)
  const [cargaUnica, setCargaUnica] = useState('')
  const [cadaLado, setCadaLado] = useState(false)
  const [editSerie, setEditSerie] = useState<{ exId: string; serieId: string; carga: string; reps: string } | null>(null)

  // Cronômetro flutuante
  const [showTimer, setShowTimer] = useState(false)
  const [timerDur, setTimerDur] = useState(90)
  const [timerSec, setTimerSec] = useState<number | null>(null)
  const [timerRunning, setTimerRunning] = useState(false)

  useEffect(() => {
    if (!timerRunning || timerSec === null || timerSec <= 0) {
      if (timerSec === 0 && timerRunning) { navigator.vibrate?.(600); setTimerRunning(false) }
      return
    }
    const t = setTimeout(() => setTimerSec(v => (v !== null && v > 0) ? v - 1 : v), 1000)
    return () => clearTimeout(t)
  }, [timerSec, timerRunning])

  function fmtTimer(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  const treino = treinos.find(t => t.id === id)
  const sessao = treino?.sessoes.find(s => s.id === sessaoId)
  if (!treino || !sessao) { nav(`/treino/${id}`); return null }

  function handleDragEndEx(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const updated = treinos.map(t => {
      if (t.id !== id) return t
      const oldIdx = t.exercicios.findIndex(e => e.id === active.id)
      const newIdx = t.exercicios.findIndex(e => e.id === over.id)
      return { ...t, exercicios: arrayMove([...t.exercicios], oldIdx, newIdx) }
    })
    saveTreinos(updated)
    setTreinos(updated)
  }

  function changeQtd(n: number) {
    setQtd(n)
    setInputs(prev => {
      if (n > prev.length) return [...prev, ...emptyInputs(n - prev.length)]
      return prev.slice(0, n)
    })
  }

  function setInput(i: number, field: keyof SerieInput, val: string) {
    setInputs(prev => prev.map((row, idx) => idx === i ? { ...row, [field]: val } : row))
  }

  function resetForm() {
    setQtd(1)
    setInputs(emptyInputs(1))
    setObs('')
    setMesmaCarga(false)
    setCargaUnica('')
    setCadaLado(false)
  }

  function buildObs(userObs: string) {
    return cadaLado ? 'CL' + (userObs ? '|' + userObs : '') : userObs
  }

  function parseCL(obsRaw: string) {
    if (obsRaw.startsWith('CL|')) return { cl: true, text: obsRaw.slice(3) }
    if (obsRaw === 'CL') return { cl: true, text: '' }
    return { cl: false, text: obsRaw }
  }

  function addSeries(exId: string) {
    const novas = mesmaCarga
      ? inputs.filter(r => r.reps).map(r => ({ id: uid(), carga: Number(cargaUnica), reps: Number(r.reps), obs: buildObs(obs.trim()) }))
      : inputs.filter(r => r.carga && r.reps).map(r => ({ id: uid(), carga: Number(r.carga), reps: Number(r.reps), obs: buildObs(obs.trim()) }))

    if (novas.length === 0) return
    if (mesmaCarga && !cargaUnica) return

    const updated = treinos.map(t => {
      if (t.id !== id) return t
      return {
        ...t,
        sessoes: t.sessoes.map(s => {
          if (s.id !== sessaoId) return s
          const hasReg = s.registros.some(r => r.exercicioId === exId)
          const registros = hasReg
            ? s.registros.map(r => r.exercicioId === exId ? { ...r, series: [...r.series, ...novas] } : r)
            : [...s.registros, { exercicioId: exId, series: novas }]
          return { ...s, registros }
        }),
      }
    })

    saveTreinos(updated)
    setTreinos(updated)
    resetForm()
  }

  function canAdd() {
    if (mesmaCarga) return !!cargaUnica && inputs.some(r => r.reps)
    return inputs.some(r => r.carga && r.reps)
  }

  function deleteSerie(exId: string, serieId: string) {
    const updated = treinos.map(t => {
      if (t.id !== id) return t
      return {
        ...t,
        sessoes: t.sessoes.map(s => {
          if (s.id !== sessaoId) return s
          return {
            ...s,
            registros: s.registros.map(r =>
              r.exercicioId === exId ? { ...r, series: r.series.filter(sr => sr.id !== serieId) } : r
            ),
          }
        }),
      }
    })
    saveTreinos(updated)
    setTreinos(updated)
  }

  function saveEditSerie() {
    if (!editSerie || !editSerie.carga || !editSerie.reps) return
    const updated = treinos.map(t => {
      if (t.id !== id) return t
      return {
        ...t,
        sessoes: t.sessoes.map(s => {
          if (s.id !== sessaoId) return s
          return {
            ...s,
            registros: s.registros.map(r =>
              r.exercicioId === editSerie.exId
                ? { ...r, series: r.series.map(sr => sr.id === editSerie.serieId ? { ...sr, carga: Number(editSerie.carga), reps: Number(editSerie.reps) } : sr) }
                : r
            ),
          }
        }),
      }
    })
    saveTreinos(updated)
    setTreinos(updated)
    setEditSerie(null)
  }

  const totalSeries = sessao.registros.reduce((n, r) => n + r.series.length, 0)

  return (
    <div className="flex flex-col min-h-dvh max-w-md mx-auto pb-8">
      <header className="sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur px-4 pt-safe pb-4 border-b border-white/5">
        <button onClick={() => nav(`/treino/${id}`)} className="flex items-center gap-1 text-white/50 text-sm mb-3 -ml-1">
          <ArrowLeft size={16} /> {treino.nome}
        </button>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-xl font-bold">Semana {sessao.semana} · {fmtDia(sessao)}</h1>
            <p className="text-sm text-white/40 mt-0.5">{totalSeries} série{totalSeries !== 1 ? 's' : ''} registrada{totalSeries !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowTimer(v => !v)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors
              ${showTimer ? 'bg-brand/15 border-brand/40 text-brand' : 'bg-white/8 border-white/10 text-white/60'}`}
          >
            <Timer size={14} />
            Timer
          </button>
        </div>
      </header>

      {showTimer && (
        <FloatingTimer
          timerSec={timerSec}
          timerDur={timerDur}
          running={timerRunning}
          onSetDur={(dur) => { setTimerDur(dur); setTimerSec(null); setTimerRunning(false) }}
          onStart={() => { if (timerSec === null || timerSec === 0) setTimerSec(timerDur); setTimerRunning(true) }}
          onPause={() => setTimerRunning(false)}
          onReset={() => { setTimerSec(null); setTimerRunning(false) }}
          onClose={() => { setShowTimer(false); setTimerRunning(false) }}
        />
      )}

      <main className="flex-1 px-4 py-4 space-y-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndEx}>
          <SortableContext items={treino.exercicios.map(e => e.id)} strategy={verticalListSortingStrategy}>
        {treino.exercicios.map((ex, i) => {
          const reg = sessao.registros.find(r => r.exercicioId === ex.id)
          const series = reg?.series ?? []
          const isOpen = openEx === ex.id

          return (
            <SortableExWrapper key={ex.id} id={ex.id}>

              {/* Header — clica pra abrir/fechar formulário */}
              <button
                onClick={() => { setOpenEx(isOpen ? null : ex.id); resetForm() }}
                className="w-full flex items-center gap-3 px-4 py-4 text-left"
              >
                <div className="w-7 h-7 rounded-xl bg-brand/15 flex items-center justify-center shrink-0">
                  <span className="text-brand text-xs font-bold">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{ex.nome}</p>
                  {ex.descricao
                    ? <p className="text-xs text-white/35 mt-0.5 truncate">{ex.descricao}</p>
                    : <p className="text-xs text-white/35 mt-0.5">{series.length} série{series.length !== 1 ? 's' : ''}</p>
                  }
                </div>
                {series.length > 0 && <Check size={14} className="text-green-500 shrink-0" />}
                {isOpen ? <ChevronUp size={16} className="text-white/30 shrink-0" /> : <ChevronDown size={16} className="text-white/30 shrink-0" />}
              </button>

              {/* Séries registradas — sempre visíveis */}
              {series.length > 0 && (
                <div className="px-4 pt-2 pb-3 space-y-1.5 border-t border-white/5">
                  {series.map((s, si) => {
                    const { cl, text: obsText } = parseCL(s.obs)
                    const isEditing = editSerie?.serieId === s.id

                    if (isEditing) {
                      return (
                        <div key={s.id} className="flex items-center gap-2">
                          <span className="text-xs font-bold text-brand w-4 shrink-0 text-center">{si + 1}</span>
                          <input
                            type="number"
                            inputMode="decimal"
                            value={editSerie!.carga}
                            onChange={e => setEditSerie(v => v && { ...v, carga: e.target.value })}
                            placeholder="kg"
                            className="min-w-0 flex-1 bg-[#252525] border border-brand/50 rounded-lg px-1 py-1.5 text-white text-center text-sm font-bold outline-none focus:border-brand"
                          />
                          <span className="text-white/30 text-xs shrink-0">×</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            value={editSerie!.reps}
                            onChange={e => setEditSerie(v => v && { ...v, reps: e.target.value })}
                            placeholder="reps"
                            className="min-w-0 flex-1 bg-[#252525] border border-brand/50 rounded-lg px-1 py-1.5 text-white text-center text-sm font-bold outline-none focus:border-brand"
                          />
                          <button onClick={saveEditSerie} className="p-1 text-green-400 shrink-0">
                            <Check size={14} />
                          </button>
                          <button onClick={() => setEditSerie(null)} className="p-1 text-white/20 shrink-0">
                            <X size={14} />
                          </button>
                        </div>
                      )
                    }

                    return (
                      <div key={s.id} className="flex items-center gap-2">
                        <span className="text-xs font-bold text-brand w-4 shrink-0 text-center">{si + 1}</span>
                        <div className="flex-1 flex items-baseline gap-2">
                          <span className="text-white font-semibold text-sm">{s.carga}<span className="text-white/40 text-xs font-normal">{cl ? 'kg/lado' : 'kg'}</span></span>
                          <span className="text-white/30 text-xs">×</span>
                          <span className="text-white font-semibold text-sm">{s.reps}<span className="text-white/40 text-xs font-normal"> reps</span></span>
                          {obsText && <span className="text-xs text-white/30">{obsText}</span>}
                        </div>
                        <button onClick={() => setEditSerie({ exId: ex.id, serieId: s.id, carga: String(s.carga), reps: String(s.reps) })} className="p-1 text-white/15 hover:text-white/60 shrink-0">
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => deleteSerie(ex.id, s.id)} className="p-1 text-white/15 hover:text-red-400 shrink-0">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Formulário de registro — só quando aberto */}
              {isOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">

                  {/* Qtd séries + = carga */}
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5 flex-1">
                      {[1, 2, 3, 4, 5, 6].map(n => (
                        <button
                          key={n}
                          onClick={() => changeQtd(n)}
                          className={`flex-1 h-8 rounded-lg text-sm font-bold transition-colors ${qtd === n ? 'bg-brand text-white' : 'bg-[#1a1a1a] text-white/40'}`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setMesmaCarga(v => !v)}
                      className={`shrink-0 px-2.5 h-8 rounded-lg text-xs font-bold border transition-colors ${mesmaCarga ? 'bg-brand/20 border-brand text-brand' : 'border-white/10 text-white/35'}`}
                    >
                      = carga
                    </button>
                  </div>

                  {/* Modo mesma carga */}
                  {mesmaCarga && (
                    <div className="flex gap-3 items-start">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs text-white/35">Carga (kg)</p>
                          <button
                            onClick={() => setCadaLado(v => !v)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${cadaLado ? 'bg-brand text-white' : 'bg-white/8 text-white/30'}`}
                          >CL</button>
                        </div>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={cargaUnica}
                          onChange={e => setCargaUnica(e.target.value)}
                          placeholder="0"
                          className="w-20 bg-[#1a1a1a] border border-white/10 rounded-xl px-2 py-2.5 text-white text-center font-bold text-base outline-none focus:border-brand"
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-xs text-white/35 text-center">Reps</p>
                        {inputs.map((row, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-xs font-bold text-brand w-4 shrink-0 text-center">{idx + 1}</span>
                            <input
                              type="number"
                              inputMode="numeric"
                              value={row.reps}
                              onChange={e => setInput(idx, 'reps', e.target.value)}
                              placeholder="0"
                              className="min-w-0 flex-1 bg-[#1a1a1a] border border-white/10 rounded-xl px-1 py-2.5 text-white text-center font-bold text-base outline-none focus:border-brand"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Modo normal: [#] [carga] [CL] [reps] */}
                  {!mesmaCarga && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 pl-6">
                        <p className="text-xs text-white/35 text-center flex-1">Carga (kg)</p>
                        <div className="w-8" />
                        <p className="text-xs text-white/35 text-center flex-1">Reps</p>
                      </div>
                      {inputs.map((row, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs font-bold text-brand w-4 shrink-0 text-center">{idx + 1}</span>
                          <input
                            type="number"
                            inputMode="decimal"
                            value={row.carga}
                            onChange={e => setInput(idx, 'carga', e.target.value)}
                            placeholder="0"
                            className="min-w-0 flex-1 bg-[#1a1a1a] border border-white/10 rounded-xl px-1 py-2.5 text-white text-center font-bold text-base outline-none focus:border-brand"
                          />
                          <button
                            onClick={() => setCadaLado(v => !v)}
                            className={`shrink-0 w-8 h-9 rounded-lg text-[10px] font-bold transition-colors ${cadaLado ? 'bg-brand text-white' : 'bg-white/8 text-white/25'}`}
                          >CL</button>
                          <input
                            type="number"
                            inputMode="numeric"
                            value={row.reps}
                            onChange={e => setInput(idx, 'reps', e.target.value)}
                            placeholder="0"
                            className="min-w-0 flex-1 bg-[#1a1a1a] border border-white/10 rounded-xl px-1 py-2.5 text-white text-center font-bold text-base outline-none focus:border-brand"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Obs */}
                  <input
                    value={obs}
                    onChange={e => setObs(e.target.value)}
                    placeholder="Obs (drop set, falha...)"
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 text-white/80 placeholder-white/20 text-xs outline-none focus:border-brand"
                  />

                  <button
                    onClick={() => addSeries(ex.id)}
                    disabled={!canAdd()}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-brand text-white text-sm font-bold disabled:opacity-30"
                  >
                    <Plus size={15} /> Adicionar {qtd} série{qtd !== 1 ? 's' : ''}
                  </button>
                </div>
              )}
            </SortableExWrapper>
          )
        })}
          </SortableContext>
        </DndContext>
      </main>
    </div>
  )
}
