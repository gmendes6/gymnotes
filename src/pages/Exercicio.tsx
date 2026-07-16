import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react'
import { getTreinos, saveTreinos } from '../store'

export default function Exercicio() {
  const { id, exId } = useParams<{ id: string; exId: string }>()
  const nav = useNavigate()
  const [treinos, setTreinos] = useState(getTreinos)
  const [showDescricao, setShowDescricao] = useState(false)

  const treino = treinos.find(t => t.id === id)
  const ex = treino?.exercicios.find(e => e.id === exId)
  if (!treino || !ex) { nav(`/treino/${id}`); return null }

  function saveDescricao(val: string) {
    ex!.descricao = val
    saveTreinos(treinos)
    setTreinos([...treinos])
  }

  // Histórico: pega séries deste exercício em cada sessão
  const historico = treino.sessoes
    .map(s => ({
      sessao: s,
      series: s.registros.find(r => r.exercicioId === exId)?.series ?? [],
    }))
    .filter(h => h.series.length > 0)
    .sort((a, b) => a.sessao.semana - b.sessao.semana || a.sessao.data.localeCompare(b.sessao.data))

  // Melhor carga de cada sessão pra linha de progressão
  const melhores = historico.map(h => ({
    semana: h.sessao.semana,
    dia: h.sessao.dia,
    melhorCarga: Math.max(...h.series.map(s => s.carga)),
  }))

  const progressao = melhores.length >= 2
    ? melhores[melhores.length - 1].melhorCarga - melhores[0].melhorCarga
    : null

  return (
    <div className="flex flex-col min-h-dvh max-w-md mx-auto pb-8">
      <header className="sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur px-4 pt-10 pb-4 border-b border-white/5">
        <button onClick={() => nav(`/treino/${id}`)} className="flex items-center gap-1 text-white/50 text-sm mb-3 -ml-1">
          <ArrowLeft size={16} /> {treino.nome}
        </button>
        <h1 className="text-xl font-bold leading-tight">{ex.nome}</h1>
        {progressao !== null && (
          <p className={`text-sm mt-1 font-medium flex items-center gap-1 ${progressao >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            <TrendingUp size={14} />
            {progressao >= 0 ? '+' : ''}{progressao}kg desde a semana {melhores[0].semana}
          </p>
        )}
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
                value={ex.descricao}
                onChange={e => saveDescricao(e.target.value)}
                placeholder="Anote dicas de técnica, variações, observações..."
                rows={4}
                className="w-full bg-[#252525] border border-white/10 rounded-xl px-3 py-3 text-white/90 placeholder-white/25 text-sm outline-none focus:border-brand resize-none leading-relaxed"
              />
            </div>
          )}
        </div>

        {/* Progressão */}
        <div>
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">
            Progressão por semana
          </p>

          {historico.length === 0 && (
            <p className="text-center text-white/25 text-sm py-8">
              Nenhum registro ainda.{'\n'}Inicie uma sessão no treino.
            </p>
          )}

          <div className="space-y-3">
            {historico.map(({ sessao, series }) => {
              const melhor = Math.max(...series.map(s => s.carga))
              const anterior = historico.indexOf(historico.find(h => h.sessao.id === sessao.id)!) > 0
                ? Math.max(...historico[historico.indexOf(historico.find(h => h.sessao.id === sessao.id)!) - 1].series.map(s => s.carga))
                : null
              const diff = anterior !== null ? melhor - anterior : null

              return (
                <div key={sessao.id} className="bg-[#1a1a1a] border border-white/8 rounded-2xl overflow-hidden">
                  {/* Header da sessão */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                    <div>
                      <p className="text-sm font-bold text-white">Semana {sessao.semana} · {sessao.dia}</p>
                    </div>
                    {diff !== null && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${diff > 0 ? 'bg-green-500/15 text-green-400' : diff < 0 ? 'bg-red-500/15 text-red-400' : 'bg-white/5 text-white/30'}`}>
                        {diff > 0 ? '+' : ''}{diff}kg
                      </span>
                    )}
                  </div>

                  {/* Séries */}
                  <div className="px-4 py-3 space-y-2">
                    {series.map((s, si) => (
                      <div key={s.id} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-brand w-4 text-center">{si + 1}</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-white font-bold">{s.carga}<span className="text-white/40 text-xs">kg</span></span>
                          <span className="text-white/30 text-xs">×</span>
                          <span className="text-white font-bold">{s.reps}<span className="text-white/40 text-xs"> reps</span></span>
                        </div>
                        {s.obs && <p className="text-xs text-white/35 ml-1">{s.obs}</p>}
                        {s.carga === melhor && series.length > 1 && (
                          <span className="ml-auto text-xs text-yellow-500/70">melhor</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
