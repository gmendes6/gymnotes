import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { getTreinos, saveTreinos, uid } from '../store'
import type { Sessao as SessaoType } from '../types'

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
  const [qtd, setQtd] = useState(3)
  const [inputs, setInputs] = useState<SerieInput[]>(emptyInputs(3))
  const [obs, setObs] = useState('')

  const treino = treinos.find(t => t.id === id)
  const sessao = treino?.sessoes.find(s => s.id === sessaoId)
  if (!treino || !sessao) { nav(`/treino/${id}`); return null }

  function save() { saveTreinos(treinos); setTreinos([...treinos]) }

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
    setQtd(3)
    setInputs(emptyInputs(3))
    setObs('')
  }

  function addSeries(exId: string) {
    const valid = inputs.filter(r => r.carga && r.reps)
    if (valid.length === 0) return
    const reg = sessao!.registros.find(r => r.exercicioId === exId)
    if (!reg) return
    const novas = valid.map(r => ({ id: uid(), carga: Number(r.carga), reps: Number(r.reps), obs: obs.trim() }))
    reg.series = [...reg.series, ...novas]
    save()
    resetForm()
  }

  function deleteSerie(exId: string, serieId: string) {
    const reg = sessao!.registros.find(r => r.exercicioId === exId)
    if (!reg) return
    reg.series = reg.series.filter(s => s.id !== serieId)
    save()
  }

  const totalSeries = sessao.registros.reduce((n, r) => n + r.series.length, 0)

  return (
    <div className="flex flex-col min-h-dvh max-w-md mx-auto pb-8">
      <header className="sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur px-4 pt-10 pb-4 border-b border-white/5">
        <button onClick={() => nav(`/treino/${id}`)} className="flex items-center gap-1 text-white/50 text-sm mb-3 -ml-1">
          <ArrowLeft size={16} /> {treino.nome}
        </button>
        <h1 className="text-xl font-bold">Semana {sessao.semana} · {fmtDia(sessao)}</h1>
        <p className="text-sm text-white/40 mt-0.5">{totalSeries} série{totalSeries !== 1 ? 's' : ''} registrada{totalSeries !== 1 ? 's' : ''}</p>
      </header>

      <main className="flex-1 px-4 py-4 space-y-3">
        {treino.exercicios.map((ex, i) => {
          const reg = sessao.registros.find(r => r.exercicioId === ex.id)
          const series = reg?.series ?? []
          const isOpen = openEx === ex.id

          return (
            <div key={ex.id} className="bg-[#1a1a1a] border border-white/8 rounded-2xl overflow-hidden">
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

              {isOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">

                  {/* Séries já registradas */}
                  {series.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-white/30 uppercase tracking-widest font-semibold">Registradas</p>
                      {series.map((s, si) => (
                        <div key={s.id} className="flex items-center gap-3">
                          <span className="text-xs font-bold text-brand w-4 text-center">{si + 1}</span>
                          <div className="flex-1 flex items-baseline gap-2">
                            <span className="text-white font-bold">{s.carga}<span className="text-white/40 text-xs">kg</span></span>
                            <span className="text-white/30 text-xs">×</span>
                            <span className="text-white font-bold">{s.reps}<span className="text-white/40 text-xs"> reps</span></span>
                            {s.obs && <span className="text-xs text-white/30 ml-1">{s.obs}</span>}
                          </div>
                          <button onClick={() => deleteSerie(ex.id, s.id)} className="p-1 text-white/15 hover:text-red-400">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Form */}
                  <div className="bg-[#252525] rounded-xl p-3 space-y-3">

                    {/* Seletor de quantidade */}
                    <div>
                      <p className="text-xs text-white/35 mb-2">Qtd de séries</p>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5, 6].map(n => (
                          <button
                            key={n}
                            onClick={() => changeQtd(n)}
                            className={`w-9 h-9 rounded-xl text-sm font-bold transition-colors ${qtd === n ? 'bg-brand text-white' : 'bg-[#1a1a1a] text-white/40'}`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Labels */}
                    <div className="grid grid-cols-2 gap-2 px-1">
                      <p className="text-xs text-white/35 text-center">Carga (kg)</p>
                      <p className="text-xs text-white/35 text-center">Reps</p>
                    </div>

                    {/* Inputs por série */}
                    <div className="space-y-2">
                      {inputs.map((row, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs font-bold text-brand w-4 text-center shrink-0">{idx + 1}</span>
                          <input
                            type="number"
                            inputMode="decimal"
                            value={row.carga}
                            onChange={e => setInput(idx, 'carga', e.target.value)}
                            placeholder="0"
                            className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-xl px-2 py-2.5 text-white text-center font-bold text-base outline-none focus:border-brand"
                          />
                          <input
                            type="number"
                            inputMode="numeric"
                            value={row.reps}
                            onChange={e => setInput(idx, 'reps', e.target.value)}
                            placeholder="0"
                            className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-xl px-2 py-2.5 text-white text-center font-bold text-base outline-none focus:border-brand"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Obs compartilhada */}
                    <input
                      value={obs}
                      onChange={e => setObs(e.target.value)}
                      placeholder="Obs (drop set, falha...)"
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 text-white/80 placeholder-white/20 text-xs outline-none focus:border-brand"
                    />

                    <button
                      onClick={() => addSeries(ex.id)}
                      disabled={inputs.every(r => !r.carga || !r.reps)}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-brand text-white text-sm font-bold disabled:opacity-30"
                    >
                      <Plus size={15} /> Adicionar {inputs.filter(r => r.carga && r.reps).length || qtd} série{qtd !== 1 ? 's' : ''}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </main>
    </div>
  )
}
