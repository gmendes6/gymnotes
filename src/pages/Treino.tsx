import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, ChevronRight, Trash2, Dumbbell } from 'lucide-react'
import { getTreinos, saveTreinos, uid } from '../store'

export default function Treino() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const [treinos, setTreinos] = useState(getTreinos)
  const [nome, setNome] = useState('')
  const [showForm, setShowForm] = useState(false)

  const treino = treinos.find(t => t.id === id)
  if (!treino) { nav('/'); return null }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const treinoRef = treino!

  function save(updated: typeof treinos) {
    saveTreinos(updated)
    setTreinos([...updated])
  }

  function addExercicio() {
    if (!nome.trim()) return
    const novo = { id: uid(), nome: nome.trim(), descricao: '', series: [] }
    treinoRef.exercicios = [...treinoRef.exercicios, novo]
    save(treinos)
    setNome('')
    setShowForm(false)
    nav(`/treino/${id}/exercicio/${novo.id}`)
  }

  function deleteExercicio(exId: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Excluir exercício?')) return
    treinoRef.exercicios = treinoRef.exercicios.filter(e => e.id !== exId)
    save(treinos)
  }

  return (
    <div className="flex flex-col min-h-dvh max-w-md mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur px-4 pt-10 pb-4 border-b border-white/5">
        <button onClick={() => nav('/')} className="flex items-center gap-1 text-white/50 text-sm mb-3 -ml-1">
          <ArrowLeft size={16} /> Treinos
        </button>
        <h1 className="text-xl font-bold leading-tight">{treino.nome}</h1>
        <p className="text-sm text-white/40 mt-0.5">{treino.exercicios.length} exercício{treino.exercicios.length !== 1 ? 's' : ''}</p>
      </header>

      {/* Lista */}
      <main className="flex-1 px-4 py-4 space-y-3">
        {treino.exercicios.length === 0 && (
          <div className="text-center py-20 text-white/30">
            <Dumbbell size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum exercício</p>
            <p className="text-xs mt-1">Toque em + para adicionar</p>
          </div>
        )}

        {treino.exercicios.map((ex, i) => (
          <button
            key={ex.id}
            onClick={() => nav(`/treino/${id}/exercicio/${ex.id}`)}
            className="w-full flex items-center gap-3 bg-[#1a1a1a] border border-white/8 rounded-2xl px-4 py-4 text-left active:scale-[.98] transition-transform"
          >
            <div className="w-8 h-8 rounded-xl bg-brand/15 flex items-center justify-center shrink-0">
              <span className="text-brand text-xs font-bold">{i + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{ex.nome}</p>
              <p className="text-xs text-white/40 mt-0.5">
                {ex.series.length} série{ex.series.length !== 1 ? 's' : ''}
                {ex.series.length > 0 && (
                  <span className="ml-2 text-white/30">
                    · última: {ex.series[ex.series.length - 1].carga}kg × {ex.series[ex.series.length - 1].reps}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={(e) => deleteExercicio(ex.id, e)}
              className="p-2 rounded-xl text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <Trash2 size={16} />
            </button>
            <ChevronRight size={18} className="text-white/20 shrink-0" />
          </button>
        ))}
      </main>

      {/* Form novo exercício */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-end z-50" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md mx-auto bg-[#1a1a1a] rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
            <p className="font-bold text-lg mb-4">Novo exercício</p>
            <input
              autoFocus
              value={nome}
              onChange={e => setNome(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addExercicio()}
              placeholder="Ex: Supino reto com barra"
              className="w-full bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-brand"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-medium">
                Cancelar
              </button>
              <button onClick={addExercicio} className="flex-1 py-3 rounded-xl bg-brand text-white text-sm font-bold">
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-6 right-1/2 translate-x-1/2 max-w-md w-[calc(100%-2rem)] mx-auto flex items-center justify-center gap-2 bg-brand text-white rounded-2xl py-4 text-sm font-bold shadow-lg shadow-brand/30 active:scale-[.97] transition-transform"
      >
        <Plus size={20} />
        Novo Exercício
      </button>
      <div className="h-24" />
    </div>
  )
}
