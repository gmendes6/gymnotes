import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, ChevronRight, ChevronDown, ChevronUp, Trash2, Dumbbell, CalendarDays, Pencil, BarChart2, Copy, GripVertical } from 'lucide-react'
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { getTreinos, saveTreinos, uid } from '../store'
import type { Sessao, Exercicio } from '../types'
import ConfirmDialog from '../components/ConfirmDialog'

type SortableSessaoItemProps = {
  s: Sessao
  onNav: () => void
  onDuplicate: (e: React.MouseEvent) => void
  onEdit: (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
  label: string
  series: number
}

function SortableSessaoItem({ s, onNav, onDuplicate, onEdit, onDelete, label, series }: SortableSessaoItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: s.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="flex items-center gap-2 bg-[#1a1a1a] border border-white/8 rounded-2xl px-2 py-3"
    >
      <button {...attributes} {...listeners} className="touch-none p-1.5 text-white/15 cursor-grab active:cursor-grabbing shrink-0">
        <GripVertical size={15} />
      </button>
      <button onClick={onNav} className="flex-1 flex items-center gap-3 min-w-0 text-left">
        <div className="w-7 h-7 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
          <CalendarDays size={13} className="text-white/40" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm">{label}</p>
          <p className="text-xs text-white/35 mt-0.5">{series} séries registradas</p>
        </div>
        <ChevronRight size={16} className="text-white/20 shrink-0" />
      </button>
      <button onClick={onDuplicate} title="Duplicar como nova sessão" className="p-1.5 text-white/15 hover:text-white/60">
        <Copy size={13} />
      </button>
      <button onClick={onEdit} className="p-1.5 text-white/15 hover:text-white/60">
        <Pencil size={13} />
      </button>
      <button onClick={onDelete} className="p-1.5 text-white/15 hover:text-red-400">
        <Trash2 size={14} />
      </button>
    </div>
  )
}

type SortableExItemProps = {
  ex: Exercicio
  i: number
  ultima: string | null
  onNav: () => void
  onEdit: (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
}

function SortableExItem({ ex, i, ultima, onNav, onEdit, onDelete }: SortableExItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ex.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="flex items-center gap-2 bg-[#1a1a1a] border border-white/8 rounded-2xl px-2 py-3"
    >
      <button {...attributes} {...listeners} className="touch-none p-1.5 text-white/15 cursor-grab active:cursor-grabbing shrink-0">
        <GripVertical size={15} />
      </button>
      <button onClick={onNav} className="flex-1 flex items-center gap-3 min-w-0 text-left">
        <div className="w-7 h-7 rounded-xl bg-brand/15 flex items-center justify-center shrink-0">
          <span className="text-brand text-xs font-bold">{i + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm truncate">{ex.nome}</p>
          {ex.descricao && <p className="text-xs text-white/40 mt-0.5 truncate">{ex.descricao}</p>}
          {ultima && <p className={`text-xs mt-0.5 truncate ${ex.descricao ? 'text-white/20' : 'text-white/35'}`}>última: {ultima}</p>}
        </div>
        <ChevronRight size={16} className="text-white/20 shrink-0" />
      </button>
      <button onClick={onEdit} className="p-1.5 text-white/15 hover:text-white/60 shrink-0">
        <Pencil size={13} />
      </button>
      <button onClick={onDelete} className="p-1.5 text-white/15 hover:text-red-400 shrink-0">
        <Trash2 size={14} />
      </button>
    </div>
  )
}

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

function todayStr() {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

function isoToDateStr(iso: string) {
  const d = new Date(iso)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

export default function Treino() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const [treinos, setTreinos] = useState(getTreinos)
  const [nomeEx, setNomeEx] = useState('')
  const [showExForm, setShowExForm] = useState(false)
  const [showSessaoForm, setShowSessaoForm] = useState(false)
  const [semana, setSemana] = useState(1)
  const [dataInput, setDataInput] = useState(todayStr)

  // edit sessão
  const [editSessao, setEditSessao] = useState<Sessao | null>(null)
  const [editSemana, setEditSemana] = useState(1)
  const [editData, setEditData] = useState('')

  const [showExercicios, setShowExercicios] = useState(
    () => localStorage.getItem(`gymnotes_showEx_${id}`) !== 'false'
  )

  // edit exercício
  const [editEx, setEditEx] = useState<Exercicio | null>(null)
  const [editNome, setEditNome] = useState('')
  const [editDesc, setEditDesc] = useState('')

  // confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null)

  function ask(message: string, onConfirm: () => void) {
    setConfirmDialog({ message, onConfirm })
  }

  // Lock body scroll on iOS when any modal is open
  useEffect(() => {
    const open = showSessaoForm || showExForm || !!editSessao || !!editEx || !!confirmDialog
    if (!open) return
    const y = window.scrollY
    document.body.style.cssText = `position:fixed;top:-${y}px;width:100%;overflow:hidden;`
    return () => {
      document.body.style.cssText = ''
      window.scrollTo(0, y)
    }
  }, [showSessaoForm, showExForm, editSessao, editEx])

  const treino = treinos.find(t => t.id === id)
  if (!treino) { nav('/'); return null }

  function save() { saveTreinos(treinos); setTreinos([...treinos]) }

  function addExercicio() {
    if (!nomeEx.trim()) return
    treino!.exercicios = [...treino!.exercicios, { id: uid(), nome: nomeEx.trim(), descricao: '' }]
    save()
    setNomeEx('')
    setShowExForm(false)
  }

  function deleteExercicio(exId: string, e: React.MouseEvent) {
    e.stopPropagation()
    ask('Excluir este exercício e todos os seus registros?', () => {
      treino!.exercicios = treino!.exercicios.filter(e => e.id !== exId)
      treino!.sessoes = treino!.sessoes.map(s => ({
        ...s, registros: s.registros.filter(r => r.exercicioId !== exId)
      }))
      save()
    })
  }

  function openEditEx(ex: Exercicio, e: React.MouseEvent) {
    e.stopPropagation()
    setEditEx(ex)
    setEditNome(ex.nome)
    setEditDesc(ex.descricao)
  }

  function saveEditEx() {
    if (!editNome.trim() || !editEx) return
    treino!.exercicios = treino!.exercicios.map(e =>
      e.id === editEx.id ? { ...e, nome: editNome.trim(), descricao: editDesc } : e
    )
    save()
    setEditEx(null)
  }

  function iniciarSessao() {
    const d = new Date(dataInput + 'T12:00:00')
    const nova: Sessao = {
      id: uid(),
      semana,
      dia: DIAS_SEMANA[d.getDay()],
      data: d.toISOString(),
      registros: treino!.exercicios.map(ex => ({ exercicioId: ex.id, series: [] })),
    }
    treino!.sessoes = [nova, ...treino!.sessoes]
    save()
    setShowSessaoForm(false)
    nav(`/treino/${id}/sessao/${nova.id}`)
  }

  function deleteSessao(sId: string, e: React.MouseEvent) {
    e.stopPropagation()
    ask('Excluir esta sessão e todos os registros?', () => {
      treino!.sessoes = treino!.sessoes.filter(s => s.id !== sId)
      save()
    })
  }

  function openEditSessao(s: Sessao, e: React.MouseEvent) {
    e.stopPropagation()
    setEditSessao(s)
    setEditSemana(s.semana)
    setEditData(isoToDateStr(s.data))
  }

  function saveEditSessao() {
    if (!editSessao) return
    const d = new Date(editData + 'T12:00:00')
    treino!.sessoes = treino!.sessoes.map(s =>
      s.id === editSessao.id
        ? { ...s, semana: editSemana, dia: DIAS_SEMANA[d.getDay()], data: d.toISOString() }
        : s
    )
    save()
    setEditSessao(null)
  }

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = treino!.exercicios.findIndex(e => e.id === active.id)
    const newIdx = treino!.exercicios.findIndex(e => e.id === over.id)
    treino!.exercicios = arrayMove([...treino!.exercicios], oldIdx, newIdx)
    save()
  }

  function handleDragEndSessao(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = treino!.sessoes.findIndex(s => s.id === active.id)
    const newIdx = treino!.sessoes.findIndex(s => s.id === over.id)
    treino!.sessoes = arrayMove([...treino!.sessoes], oldIdx, newIdx)
    save()
  }

  function duplicarSessao(s: Sessao, e: React.MouseEvent) {
    e.stopPropagation()
    const d = new Date()
    const nova: Sessao = {
      id: uid(),
      semana: maxSemana + 1,
      dia: DIAS_SEMANA[d.getDay()],
      data: d.toISOString(),
      registros: s.registros.map(r => ({
        exercicioId: r.exercicioId,
        series: r.series.map(sr => ({ ...sr, id: uid() })),
      })),
    }
    treino!.sessoes = [nova, ...treino!.sessoes]
    save()
  }

  const maxSemana = treino.sessoes.reduce((m, s) => Math.max(m, s.semana), 0)

  function ultimaCarga(exId: string) {
    for (let i = treino!.sessoes.length - 1; i >= 0; i--) {
      const reg = treino!.sessoes[i].registros.find(r => r.exercicioId === exId)
      if (reg && reg.series.length > 0) {
        const s = reg.series[reg.series.length - 1]
        return `${s.carga}kg × ${s.reps}`
      }
    }
    return null
  }

  function fmtDia(sessao: Sessao) {
    const d = new Date(sessao.data)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    return `${sessao.dia.slice(0, 3)}, ${dd}/${mm}`
  }

  return (
    <div className="flex flex-col min-h-dvh max-w-md mx-auto">
      <header className="sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur px-4 pt-safe pb-4 border-b border-white/5">
        <button onClick={() => nav('/')} className="flex items-center gap-1 text-white/50 text-sm mb-3 -ml-1">
          <ArrowLeft size={16} /> Treinos
        </button>
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-bold leading-tight truncate">{treino.nome}</h1>
          <button
            onClick={() => nav(`/treino/${id}/evolucao`)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/8 text-white/60 text-xs font-medium"
          >
            <BarChart2 size={13} /> Evolução
          </button>
        </div>
        <p className="text-sm text-white/40 mt-0.5">
          {treino.exercicios.length} exercício{treino.exercicios.length !== 1 ? 's' : ''} · {treino.sessoes.length} sess{treino.sessoes.length !== 1 ? 'ões' : 'ão'}
        </p>
      </header>

      <main className="flex-1 px-4 py-4 space-y-6 pb-28">

        {/* Exercícios */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setShowExercicios(v => { const next = !v; localStorage.setItem(`gymnotes_showEx_${id}`, String(next)); return next })} className="flex items-center gap-1.5 text-xs font-semibold text-white/40 uppercase tracking-widest">
              {showExercicios ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              Exercícios
            </button>
            <button onClick={() => setShowExForm(true)} className="text-brand text-xs font-bold flex items-center gap-1">
              <Plus size={13} /> Adicionar
            </button>
          </div>

          {showExercicios && treino.exercicios.length === 0 && (
            <div className="text-center py-8 text-white/25">
              <Dumbbell size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Adicione os exercícios do treino</p>
            </div>
          )}

          {showExercicios && (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={treino.exercicios.map(e => e.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {treino.exercicios.map((ex, i) => (
                    <SortableExItem
                      key={ex.id}
                      ex={ex}
                      i={i}
                      ultima={ultimaCarga(ex.id)}
                      onNav={() => nav(`/treino/${id}/exercicio/${ex.id}`)}
                      onEdit={e => openEditEx(ex, e)}
                      onDelete={e => deleteExercicio(ex.id, e)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </section>

        {/* Histórico de sessões */}
        <section>
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Sessões realizadas</p>

          {treino.sessoes.length === 0 && (
            <p className="text-center text-white/25 text-sm py-6">Nenhuma sessão ainda</p>
          )}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndSessao}>
            <SortableContext items={treino.sessoes.map(s => s.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {treino.sessoes.map(s => (
                  <SortableSessaoItem
                    key={s.id}
                    s={s}
                    label={`Semana ${s.semana} · ${fmtDia(s)}`}
                    series={s.registros.reduce((n, r) => n + r.series.length, 0)}
                    onNav={() => nav(`/treino/${id}/sessao/${s.id}`)}
                    onDuplicate={e => duplicarSessao(s, e)}
                    onEdit={e => openEditSessao(s, e)}
                    onDelete={e => deleteSessao(s.id, e)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>
      </main>

      {/* Modal nova sessão */}
      {showSessaoForm && (
        <div className="fixed inset-0 bg-black/60 flex items-end z-50" onClick={() => setShowSessaoForm(false)}>
          <div className="w-full max-w-md mx-auto bg-[#1a1a1a] rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
            <p className="font-bold text-lg mb-5">Nova sessão</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/40 mb-2 block">Semana</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={semana}
                  onChange={e => setSemana(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-brand"
                />
                {maxSemana > 0 && semana <= maxSemana && (
                  <p className="text-xs text-brand/70 mt-2">Você já tem sessão na semana {semana}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-white/40 mb-2 block">Data</label>
                <input
                  type="date"
                  value={dataInput}
                  onChange={e => setDataInput(e.target.value)}
                  className="w-full bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-brand [color-scheme:dark]"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowSessaoForm(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-medium">
                Cancelar
              </button>
              <button onClick={iniciarSessao} className="flex-1 py-3 rounded-xl bg-brand text-white text-sm font-bold">
                Iniciar treino
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar sessão */}
      {editSessao && (
        <div className="fixed inset-0 bg-black/60 flex items-end z-50" onClick={() => setEditSessao(null)}>
          <div className="w-full max-w-md mx-auto bg-[#1a1a1a] rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
            <p className="font-bold text-lg mb-5">Editar sessão</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/40 mb-2 block">Semana</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={editSemana}
                  onChange={e => setEditSemana(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-2 block">Data</label>
                <input
                  type="date"
                  value={editData}
                  onChange={e => setEditData(e.target.value)}
                  className="w-full bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-brand [color-scheme:dark]"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditSessao(null)} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-medium">
                Cancelar
              </button>
              <button onClick={saveEditSessao} className="flex-1 py-3 rounded-xl bg-brand text-white text-sm font-bold">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal novo exercício */}
      {showExForm && (
        <div className="fixed inset-0 bg-black/60 flex items-end z-50" onClick={() => setShowExForm(false)}>
          <div className="w-full max-w-md mx-auto bg-[#1a1a1a] rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
            <p className="font-bold text-lg mb-4">Novo exercício</p>
            <input
              autoFocus
              value={nomeEx}
              onChange={e => setNomeEx(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addExercicio()}
              placeholder="Ex: Supino reto com barra"
              className="w-full bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-brand"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowExForm(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-medium">Cancelar</button>
              <button onClick={addExercicio} className="flex-1 py-3 rounded-xl bg-brand text-white text-sm font-bold">Adicionar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar exercício */}
      {editEx && (
        <div className="fixed inset-0 bg-black/60 flex items-end z-50" onClick={() => setEditEx(null)}>
          <div className="w-full max-w-md mx-auto bg-[#1a1a1a] rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
            <p className="font-bold text-lg mb-4">Editar exercício</p>
            <div className="space-y-3">
              <input
                autoFocus
                value={editNome}
                onChange={e => setEditNome(e.target.value)}
                placeholder="Nome do exercício"
                className="w-full bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-brand"
              />
              <textarea
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                placeholder="Técnica, observações... (opcional)"
                rows={3}
                className="w-full bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder-white/25 text-xs outline-none focus:border-brand resize-none leading-relaxed"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setEditEx(null)} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-medium">Cancelar</button>
              <button onClick={saveEditEx} className="flex-1 py-3 rounded-xl bg-brand text-white text-sm font-bold">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog(null) }}
          onCancel={() => setConfirmDialog(null)}
          confirmLabel="Excluir"
        />
      )}

      {/* FAB */}
      <button
        onClick={() => { setSemana(maxSemana + 1); setDataInput(todayStr()); setShowSessaoForm(true) }}
        className="fixed bottom-6 right-1/2 translate-x-1/2 max-w-md w-[calc(100%-2rem)] mx-auto flex items-center justify-center gap-2 bg-brand text-white rounded-2xl py-4 text-sm font-bold shadow-lg shadow-brand/30 active:scale-[.97] transition-transform"
      >
        <Plus size={20} />
        Registrar treino
      </button>
    </div>
  )
}
