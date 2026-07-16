import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react'
import { getTreinos } from '../store'

type WeekStat = {
  semana: number
  volume: number
  cargaMax: number
  totalReps: number
  totalSeries: number
  e1RM: number
}

type ExStat = {
  exId: string
  nome: string
  weeks: { semana: number; cargaMax: number; totalReps: number; volume: number; series: number; e1RM: number }[]
}

// Epley: estima 1RM a partir de qualquer combinação carga/reps
function epley(carga: number, reps: number): number {
  if (reps === 1) return carga
  return carga * (1 + reps / 30)
}

function pct(a: number, b: number): number | null {
  if (b === 0) return null
  return ((a - b) / b) * 100
}

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n))
}

function Trend({ val }: { val: number | null }) {
  if (val === null) return <span className="text-white/25 text-xs">—</span>
  if (Math.abs(val) < 0.5)
    return <span className="flex items-center gap-0.5 text-white/40 text-xs"><Minus size={11} /> 0%</span>
  const up = val > 0
  return (
    <span className={`flex items-center gap-0.5 text-xs font-bold ${up ? 'text-green-400' : 'text-red-400'}`}>
      {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {up ? '+' : ''}{val.toFixed(1)}%
    </span>
  )
}

function SparkLine({ values }: { values: number[] }) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const W = 100, H = 36, p = 3

  const pts = values.map((v, i) => {
    const x = p + (i / (values.length - 1)) * (W - p * 2)
    const y = H - p - ((v - min) / range) * (H - p * 2)
    return [x, y] as [number, number]
  })

  const line = pts.map(([x, y]) => `${x},${y}`).join(' ')
  const area = `${pts[0][0]},${H} ` + pts.map(([x, y]) => `${x},${y}`).join(' ') + ` ${pts[pts.length - 1][0]},${H}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-9">
      <defs>
        <linearGradient id="spk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E11D48" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#E11D48" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#spk)" />
      <polyline points={line} fill="none" stroke="#E11D48" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.5" fill="#E11D48" />)}
    </svg>
  )
}

function LineChart({ semanas, values, id: chartId }: { semanas: number[]; values: number[]; id: string }) {
  if (values.length < 2) return (
    <p className="text-center text-white/25 text-xs py-4">Adicione mais sessões para ver o gráfico</p>
  )
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const W = 300, H = 90, pl = 4, pr = 4, pt = 8, pb = 22

  const pts = values.map((v, i) => {
    const x = pl + (i / (values.length - 1)) * (W - pl - pr)
    const y = pt + (1 - (v - min) / range) * (H - pt - pb)
    return [x, y] as [number, number]
  })

  const line = pts.map(([x, y]) => `${x},${y}`).join(' ')
  const area = `${pts[0][0]},${H - pb} ` + pts.map(([x, y]) => `${x},${y}`).join(' ') + ` ${pts[pts.length - 1][0]},${H - pb}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-24">
      <defs>
        <linearGradient id={`cg_${chartId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E11D48" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#E11D48" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map(t => {
        const y = pt + t * (H - pt - pb)
        return <line key={t} x1={pl} y1={y} x2={W - pr} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      })}
      <polygon points={area} fill={`url(#cg_${chartId})`} />
      <polyline points={line} fill="none" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="3" fill="#E11D48" />
          <text x={x} y={H - 5} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8">S{semanas[i]}</text>
        </g>
      ))}
    </svg>
  )
}

export default function Evolucao() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const treinos = getTreinos()
  const [openEx, setOpenEx] = useState<string | null>(null)

  const treino = treinos.find(t => t.id === id)
  if (!treino) { nav('/'); return null }

  const semanas = [...new Set(treino.sessoes.map(s => s.semana))].sort((a, b) => a - b)

  if (semanas.length === 0) {
    return (
      <div className="flex flex-col min-h-dvh max-w-md mx-auto">
        <header className="sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur px-4 pt-safe pb-4 border-b border-white/5">
          <button onClick={() => nav(`/treino/${id}`)} className="flex items-center gap-1 text-white/50 text-sm mb-3 -ml-1">
            <ArrowLeft size={16} /> {treino.nome}
          </button>
          <h1 className="text-xl font-bold">Evolução</h1>
        </header>
        <div className="flex-1 flex items-center justify-center text-white/25 text-sm px-8 text-center">
          Registre pelo menos uma sessão para ver a evolução.
        </div>
      </div>
    )
  }

  function weekStats(semana: number): WeekStat {
    const sess = treino!.sessoes.filter(s => s.semana === semana)
    let volume = 0, cargaMax = 0, totalReps = 0, totalSeries = 0, e1RM = 0
    for (const s of sess) {
      for (const reg of s.registros) {
        for (const sr of reg.series) {
          volume += sr.carga * sr.reps
          if (sr.carga > cargaMax) cargaMax = sr.carga
          totalReps += sr.reps
          totalSeries++
          const est = epley(sr.carga, sr.reps)
          if (est > e1RM) e1RM = est
        }
      }
    }
    return { semana, volume, cargaMax, totalReps, totalSeries, e1RM }
  }

  const weekData = semanas.map(weekStats)

  const exStats: ExStat[] = treino.exercicios.map(ex => {
    const weeks = semanas.map(semana => {
      const sess = treino!.sessoes.filter(s => s.semana === semana)
      let cargaMax = 0, totalReps = 0, volume = 0, series = 0, e1RM = 0
      for (const s of sess) {
        const reg = s.registros.find(r => r.exercicioId === ex.id)
        if (!reg) continue
        for (const sr of reg.series) {
          if (sr.carga > cargaMax) cargaMax = sr.carga
          totalReps += sr.reps
          volume += sr.carga * sr.reps
          series++
          const est = epley(sr.carga, sr.reps)
          if (est > e1RM) e1RM = est
        }
      }
      return { semana, cargaMax, totalReps, volume, series, e1RM }
    }).filter(w => w.series > 0)
    return { exId: ex.id, nome: ex.nome, weeks }
  }).filter(e => e.weeks.length > 0)

  const first = weekData[0]
  const last = weekData[weekData.length - 1]
  const totalVolume = weekData.reduce((n, w) => n + w.volume, 0)
  const totalSeries = weekData.reduce((n, w) => n + w.totalSeries, 0)
  const totalReps = weekData.reduce((n, w) => n + w.totalReps, 0)

  return (
    <div className="flex flex-col min-h-dvh max-w-md mx-auto pb-8">
      <header className="sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur px-4 pt-safe pb-4 border-b border-white/5">
        <button onClick={() => nav(`/treino/${id}`)} className="flex items-center gap-1 text-white/50 text-sm mb-3 -ml-1">
          <ArrowLeft size={16} /> {treino.nome}
        </button>
        <h1 className="text-xl font-bold">Evolução</h1>
        <p className="text-sm text-white/40 mt-0.5">
          {semanas.length} semana{semanas.length !== 1 ? 's' : ''} · {treino.sessoes.length} sess{treino.sessoes.length !== 1 ? 'ões' : 'ão'}
        </p>
      </header>

      <main className="flex-1 px-4 py-4 space-y-5">

        {/* Cards de resumo — foco em intensidade */}
        <div className="grid grid-cols-2 gap-3">
          {/* e1RM — métrica principal de força */}
          <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-4 col-span-2">
            <p className="text-xs text-white/40 mb-1">1RM estimado (melhor)</p>
            <p className="text-3xl font-bold text-white">{Math.round(last.e1RM)}<span className="text-sm font-normal text-white/40 ml-1">kg</span></p>
            {semanas.length >= 2 && (
              <div className="mt-1 flex items-center gap-1.5">
                <Trend val={pct(last.e1RM, first.e1RM)} />
                <span className="text-xs text-white/30">vs semana {first.semana}</span>
              </div>
            )}
          </div>
          <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-4">
            <p className="text-xs text-white/40 mb-1">Carga máx. levantada</p>
            <p className="text-2xl font-bold text-white">{last.cargaMax}<span className="text-xs font-normal text-white/40 ml-0.5">kg</span></p>
            {semanas.length >= 2 && <div className="mt-1"><Trend val={pct(last.cargaMax, first.cargaMax)} /></div>}
          </div>
          <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-4">
            <p className="text-xs text-white/40 mb-1">Volume</p>
            <p className="text-2xl font-bold text-white">{fmt(totalVolume)}<span className="text-xs font-normal text-white/40 ml-0.5">kr</span></p>
            {semanas.length >= 2 && <div className="mt-1"><Trend val={pct(last.volume, first.volume)} /></div>}
          </div>
        </div>

        {/* Gráfico e1RM por semana */}
        <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-4">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-0.5">Intensidade por semana</p>
          <p className="text-[10px] text-white/20 mb-3">1RM estimado — normaliza qualquer combinação de carga e reps</p>
          <LineChart semanas={semanas} values={weekData.map(w => w.e1RM)} id="e1rm" />

          <div className="mt-4 space-y-2">
            {weekData.map((w, i) => {
              const prev = i > 0 ? weekData[i - 1].e1RM : null
              const delta = prev !== null ? pct(w.e1RM, prev) : null
              const maxVal = Math.max(...weekData.map(d => d.e1RM))
              return (
                <div key={w.semana} className="flex items-center gap-2">
                  <span className="text-white/40 w-10 shrink-0 text-xs">Sem {w.semana}</span>
                  <div className="flex-1 bg-[#252525] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full transition-all"
                      style={{ width: `${maxVal ? (w.e1RM / maxVal) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-white text-xs font-semibold w-14 text-right shrink-0">{Math.round(w.e1RM)}kg</span>
                  <div className="w-14 flex justify-end shrink-0"><Trend val={delta} /></div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Por exercício */}
        {exStats.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Por exercício</p>
            <div className="space-y-2">
              {exStats.map(ex => {
                const isOpen = openEx === ex.exId
                const fw = ex.weeks[0]
                const lw = ex.weeks[ex.weeks.length - 1]
                const has2 = ex.weeks.length >= 2
                const trendE1RM  = has2 ? pct(lw.e1RM,      fw.e1RM)      : null
                const trendVol   = has2 ? pct(lw.volume,    fw.volume)    : null
                const trendReps  = has2 ? pct(lw.totalReps, fw.totalReps) : null

                return (
                  <div key={ex.exId} className="bg-[#1a1a1a] border border-white/8 rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setOpenEx(isOpen ? null : ex.exId)}
                      className="w-full flex items-center gap-3 px-4 py-4 text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{ex.nome}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-white/35">{ex.weeks.length} sem.</span>
                          {/* e1RM normaliza carga+reps — 1 rep mais pesado OU mais reps mesma carga = progresso */}
                          <Trend val={trendE1RM} />
                        </div>
                      </div>
                      {has2 && (
                        <div className="w-20 shrink-0">
                          <SparkLine values={ex.weeks.map(w => w.e1RM)} />
                        </div>
                      )}
                      {isOpen ? <ChevronUp size={16} className="text-white/30 shrink-0" /> : <ChevronDown size={16} className="text-white/30 shrink-0" />}
                    </button>

                    {isOpen && (
                      <div className="border-t border-white/5 px-4 pb-4 pt-3 space-y-4">

                        {/* 3 mini-cards: e1RM, reps, volume */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-[#252525] rounded-xl p-2.5">
                            <p className="text-[10px] text-white/35 mb-1">e1RM est.</p>
                            <p className="text-base font-bold text-white leading-none">{Math.round(lw.e1RM)}<span className="text-[10px] font-normal text-white/40 ml-0.5">kg</span></p>
                            <div className="mt-1"><Trend val={trendE1RM} /></div>
                          </div>
                          <div className="bg-[#252525] rounded-xl p-2.5">
                            <p className="text-[10px] text-white/35 mb-1">Reps</p>
                            <p className="text-base font-bold text-white leading-none">{lw.totalReps}</p>
                            <div className="mt-1"><Trend val={trendReps} /></div>
                          </div>
                          <div className="bg-[#252525] rounded-xl p-2.5">
                            <p className="text-[10px] text-white/35 mb-1">Volume</p>
                            <p className="text-base font-bold text-white leading-none">{fmt(lw.volume)}<span className="text-[10px] font-normal text-white/40 ml-0.5">kr</span></p>
                            <div className="mt-1"><Trend val={trendVol} /></div>
                          </div>
                        </div>

                        {/* Gráfico de e1RM estimado */}
                        {has2 && (
                          <div>
                            <p className="text-xs text-white/30 mb-0.5">1RM estimado por semana</p>
                            <p className="text-[10px] text-white/20 mb-2">Epley: carga × (1 + reps/30) — normaliza diferentes intensidades</p>
                            <LineChart semanas={ex.weeks.map(w => w.semana)} values={ex.weeks.map(w => w.e1RM)} id={ex.exId} />
                          </div>
                        )}

                        {/* Tabela: Sem | Carga | Reps | e1RM | Δe1RM */}
                        <div>
                          <div className="grid gap-1 text-[10px] text-white/30 mb-1.5 px-1" style={{ gridTemplateColumns: '2rem 1fr 1fr 1fr 1fr' }}>
                            <span>Sem</span>
                            <span className="text-center">Carga</span>
                            <span className="text-center">Reps</span>
                            <span className="text-center">e1RM</span>
                            <span className="text-right">Δ</span>
                          </div>
                          {ex.weeks.map((w, i) => {
                            const prev = i > 0 ? ex.weeks[i - 1] : null
                            const dE1RM = prev ? pct(w.e1RM, prev.e1RM) : null
                            return (
                              <div
                                key={w.semana}
                                className={`grid gap-1 text-xs px-1 py-1.5 rounded-lg ${i % 2 === 0 ? 'bg-[#252525]/50' : ''}`}
                                style={{ gridTemplateColumns: '2rem 1fr 1fr 1fr 1fr' }}
                              >
                                <span className="text-white/50">{w.semana}</span>
                                <span className="text-white font-semibold text-center">{w.cargaMax}kg</span>
                                <span className="text-white/70 text-center">{w.totalReps}</span>
                                <span className="text-white/70 text-center">{Math.round(w.e1RM)}kg</span>
                                <div className="flex justify-end"><Trend val={dE1RM} /></div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
