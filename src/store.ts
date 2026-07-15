import type { Treino } from './types'

const KEY = 'gymnotes_treinos'

export function getTreinos(): Treino[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') }
  catch { return [] }
}

export function saveTreinos(treinos: Treino[]) {
  localStorage.setItem(KEY, JSON.stringify(treinos))
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}
