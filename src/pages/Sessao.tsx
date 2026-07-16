import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { getTreinos, saveTreinos, uid } from '../store'

export default function Sessao() {
  const { id, sessaoId } = useParams<{ id: string; sessaoId: string }>()
  const nav = useNavigate()
  const [treinos, setTreinos] = useState(getTreinos)
  const [openEx, setOpenEx] = useState<string | null>(null)
  const [carga, setCarga] = useState('')
  const [reps, setReps] = useState('')
  const [obs, setObs] = useState('')

  const treino = treinos.find(t => t.id === id)
  const sessao = treino?.sessoes.find(s => s.id === sessaoId)
  if (!treino || !sessao) { nav(`/treino/${id}`); return null }

  function save() { saveTreinos(treinos); setTreinos([...treinos]) }

  function addSerie(exId: string) {
    if (!carga || !reps) return
    const reg = sessao!.registros.find(r => r.exercicioId === exId)
    if (!reg) return
    reg.series = [...reg.series, { id: uid(), carga: Number(carga), reps: Number(reps), obs: obs.trim() }]
    save()
    setCarga('')
    setReps('')
    setObs('')
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
        <h1 className="text-xl font-bold">Semana {sessao.semana} · {sessao.dia}</h1>
        <p className="text-sm text-white/40 mt-0.5">{totalSeries} série{totalSeries !== 1 ? 's' : ''} registrada{totalSeries !== 1 ? 's' : ''}</p>
      </header>

      <main className="flex-1 px-4 py-4 space-y-3">
        {treino.exercicios.map((ex, i) => {
          const reg = sessao.registros.find(r => r.exercicioId === ex.id)
          const series = reg?.series ?? []
          const isOpen = openEx === ex.id

          return (
            <div key={ex.id} className="bg-[#1a1a1a] border border-white/8 rounded-2xl overflow-hidden">
              {/* Header do exercício */}
              <button
                onClick={() => { setOpenEx(isOpen ? null : ex.id); setCarga(''); setReps(''); setObs('') }}
                className="w-full flex items-center gap-3 px-4 py-4 text-left"
              >
                <div className="w-7 h-7 rounded-xl bg-brand/15 flex items-center justify-center shrink-0">
                  <span className="text-brand text-xs font-bold">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{ex.nome}</p>
                  <p className="text-xs text-white/35 mt-0.5">{series.length} série{series.length !== 1 ? 's' : ''}</p>
                </div>
                {series.length > 0 && <Check size={14} className="text-green-500 shrink-0" />}
                {isOpen ? <ChevronUp size={16} className="text-white/30 shrink-0" /> : <ChevronDown size={16} className="text-white/30 shrink-0" />}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                  {/* Séries já registradas */}
                  {series.map((s, si) => (
                    <div key={s.id} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-brand w-4 text-center">{si + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-white font-bold">{s.carga}<span className="text-white/40 text-xs">kg</span></span>
                          <span className="text-white/30 text-xs">×</span>
                          <span className="text-white font-bold">{s.reps}<span className="text-white/40 text-xs"> reps</span></span>
                        </div>
                        {s.obs && <p className="text-xs text-white/35">{s.obs}</p>}
                      </div>
                      <button onClick={() => deleteSerie(ex.id, s.id)} className="p-1 text-white/15 hover:text-red-400">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}

                  {/* Form nova série */}
                  <div className="bg-[#252525] rounded-xl p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-white/35 block mb-1">Carga (kg)</label>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={carga}
                          onChange={e => setCarga(e.target.value)}
                          placeholder="0"
                          className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5 text-white text-center font-bold text-lg outline-none focus:border-brand"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-white/35 block mb-1">Reps</label>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={reps}
                          onChange={e => setReps(e.target.value)}
                          placeholder="0"
                          className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2.5 text-white text-center font-bold text-lg outline-none focus:border-brand"
                        />
                      </div>
                    </div>
                    <input
                      value={obs}
                      onChange={e => setObs(e.target.value)}
                      placeholder="Obs (drop set, falha...)"
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 text-white/80 placeholder-white/20 text-xs outline-none focus:border-brand"
                    />
                    <button
                      onClick={() => addSerie(ex.id)}
                      disabled={!carga || !reps}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-brand text-white text-sm font-bold disabled:opacity-30"
                    >
                      <Plus size={15} /> Adicionar série
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
