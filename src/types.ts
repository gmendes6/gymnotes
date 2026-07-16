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
}

export interface RegistroExercicio {
  exercicioId: string
  series: Serie[]
}

export interface Sessao {
  id: string
  semana: number
  dia: string
  data: string
  registros: RegistroExercicio[]
}

export interface Treino {
  id: string
  nome: string
  criadoEm: string
  exercicios: Exercicio[]
  sessoes: Sessao[]
}
