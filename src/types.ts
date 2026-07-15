export interface Serie {
  id: string
  carga: number
  reps: number
  obs: string
}

export interface Exercicio {
  id: string
  nome: string
  descricao: string
  series: Serie[]
}

export interface Treino {
  id: string
  nome: string
  criadoEm: string
  exercicios: Exercicio[]
}
