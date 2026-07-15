import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { getTreinos, saveTreinos, uid } from '../store'

export default function Exercicio() {
  const { id, exId } = useParams<{ id: string; exId: string }>()
  const nav = useNavigate()
  const [treinos, setTreinos] = useState(getTreinos)
  const [showDescricao, setShowDescricao] = useState(false)
  const [showSerieForm, setShowSerieForm] = useState(false)
  const [carga, setCarga] = useState('')
  const [reps, setReps] = useState('')
  const [obs, setObs] = useState('')

  const treino = treinos.find(t => t.id === id)
  const ex = treino?.exercicios.find(e => e.id === exId)
  if (!treino || !ex) { nav(`/treino/${id}`); return null }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const exRef = ex!

  function save() {
    saveTreinos(treinos)
    setTreinos([...treinos])
  }

  function saveDescricao(val: string) {
    exRef.descricao = val
    save()
  }

  function addSerie() {
    if (!carga || !reps) return
    exRef.series = [...exRef.series, { id: uid(), carga: Number(carga), reps: Number(reps), obs: obs.trim() }]
    save()
    setCarga('')
    setReps('')
    setObs('')
    setShowSerieForm(false)
  }

  function deleteSerie(sid: string) {
    exRef.series = exRef.series.filter(s => s.id !== sid)
    save()
  }

  return (
    <div className="flex flex-col min-h-dvh max-w-md mx-auto pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur px-4 pt-10 pb-4 border-b border-white/5">
        <button onClick={() => nav(`/treino/${id}`)} className="flex items-center gap-1 text-white/50 text-sm mb-3 -ml-1">
          <ArrowLeft size={16} /> {treino.nome}
        </button>
        <h1 className="text-xl font-bold leading-tight">{exRef.nome}</h1>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4">

        {/* Descrição / técnica */}
        <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowDescricao(!showDescricao)}
            className="w-full flex items-center gap-3 px-4 py-4 text-left"
          >
            <FileText size={16} className="text-brand shrink-0" />
            <span className="flex-1 text-sm font-medium text-white/80">Descrição / Técnica</span>
            {showDescricao ? <ChevronUp size={16} className="text-white/30" /> : <ChevronDown size={16} className="text-white/30" />}
          </button>
          {showDescricao && (
            <div className="px-4 pb-4">
              <textarea
                value={exRef.descricao}
                onChange={e => saveDescricao(e.target.value)}
                placeholder="Anote dicas de técnica, variações, observações..."
                rows={4}
                className="w-full bg-[#252525] border border-white/10 rounded-xl px-3 py-3 text-white/90 placeholder-white/25 text-sm outline-none focus:border-brand resize-none leading-relaxed"
              />
            </div>
          )}
        </div>

        {/* Séries */}
        <div>
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">
            Séries ({exRef.series.length})
          </p>

          {exRef.series.length === 0 && (
            <p className="text-center text-white/25 text-sm py-6">Nenhuma série registrada</p>
          )}

          <div className="space-y-2">
            {exRef.series.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 bg-[#1a1a1a] border border-white/8 rounded-2xl px-4 py-3">
                <span className="text-xs font-bold text-brand w-5 text-center">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-white font-bold text-lg">{s.carga}<span className="text-white/40 text-sm font-normal">kg</span></span>
                    <span className="text-white/30">×</span>
                    <span className="text-white font-bold text-lg">{s.reps}<span className="text-white/40 text-sm font-normal"> reps</span></span>
                  </div>
                  {s.obs && <p className="text-xs text-white/40 mt-0.5">{s.obs}</p>}
                </div>
                <button
                  onClick={() => deleteSerie(s.id)}
                  className="p-2 rounded-xl text-white/15 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Form nova série inline */}
        {showSerieForm && (
          <div className="bg-[#1a1a1a] border border-brand/30 rounded-2xl p-4 space-y-3">
            <p className="text-sm font-semibold text-white/70">Nova série</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Carga (kg)</label>
                <input
                  autoFocus
                  type="number"
                  inputMode="decimal"
                  value={carga}
                  onChange={e => setCarga(e.target.value)}
                  placeholder="0"
                  className="w-full bg-[#252525] border border-white/10 rounded-xl px-3 py-3 text-white text-center text-lg font-bold outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Repetições</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={reps}
                  onChange={e => setReps(e.target.value)}
                  placeholder="0"
                  className="w-full bg-[#252525] border border-white/10 rounded-xl px-3 py-3 text-white text-center text-lg font-bold outline-none focus:border-brand"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Observação (opcional)</label>
              <input
                value={obs}
                onChange={e => setObs(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSerie()}
                placeholder="Ex: Drop set, parcial, até a falha..."
                className="w-full bg-[#252525] border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/25 text-sm outline-none focus:border-brand"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowSerieForm(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-medium">
                Cancelar
              </button>
              <button onClick={addSerie} disabled={!carga || !reps} className="flex-1 py-3 rounded-xl bg-brand text-white text-sm font-bold disabled:opacity-40">
                Salvar série
              </button>
            </div>
          </div>
        )}

        {/* Botão add série */}
        {!showSerieForm && (
          <button
            onClick={() => setShowSerieForm(true)}
            className="w-full flex items-center justify-center gap-2 border border-dashed border-white/15 rounded-2xl py-4 text-sm text-white/40 hover:border-brand/50 hover:text-brand/70 transition-colors active:scale-[.98]"
          >
            <Plus size={16} />
            Adicionar série
          </button>
        )}
      </main>
    </div>
  )
}
