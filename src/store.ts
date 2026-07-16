import type { Treino, Sessao } from './types'

const KEY = 'gymnotes_treinos'

export function getTreinos(): Treino[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return raw.map(migrate)
  } catch { return [] }
}

// Migra dados antigos (exercicio.series) para sessao "Semana 1"
function migrate(t: any): Treino {
  const sessoes: Sessao[] = t.sessoes ?? []

  if (sessoes.length === 0) {
    const registros = (t.exercicios ?? [])
      .filter((ex: any) => ex.series?.length > 0)
      .map((ex: any) => ({ exercicioId: ex.id, series: ex.series }))

    if (registros.length > 0) {
      sessoes.push({ id: uid(), semana: 1, dia: 'Não definido', data: t.criadoEm, registros })
    }
  }

  return {
    ...t,
    exercicios: (t.exercicios ?? []).map(({ series: _s, ...ex }: any) => ex),
    sessoes,
  }
}

export function saveTreinos(treinos: Treino[]) {
  localStorage.setItem(KEY, JSON.stringify(treinos))
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}
