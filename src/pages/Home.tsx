import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dumbbell, Plus, ChevronRight, Trash2, Copy, ClipboardPaste, Check, Flame } from 'lucide-react'
import { getTreinos, saveTreinos, uid } from '../store'
import ConfirmDialog from '../components/ConfirmDialog'
import type { Sessao } from '../types'

function weekIdx(date: Date): number {
  return Math.floor(date.getTime() / (7 * 24 * 60 * 60 * 1000))
}

function sessionsThisWeek(sessoes: Sessao[]): number {
  const now = weekIdx(new Date())
  return sessoes.filter(s => weekIdx(new Date(s.data)) === now).length
}

function calcStreak(sessoes: Sessao[]): number {
  if (!sessoes.length) return 0
  const weeks = [...new Set(sessoes.map(s => weekIdx(new Date(s.data))))].sort((a, b) => b - a)
  if (weeks[0] < weekIdx(new Date()) - 1) return 0
  let streak = 1
  for (let i = 1; i < weeks.length; i++) {
    if (weeks[i - 1] - weeks[i] === 1) streak++
    else break
  }
  return streak
}

export default function Home() {
  const [treinos, setTreinos] = useState(getTreinos)
  const [nome, setNome] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')
  const [copied, setCopied] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null)
  const nav = useNavigate()

  const exportData = localStorage.getItem('gymnotes_treinos') ?? '[]'

  function addTreino() {
    if (!nome.trim()) return
    const novo = { id: uid(), nome: nome.trim(), criadoEm: new Date().toISOString(), exercicios: [], sessoes: [] }
    const updated = [novo, ...treinos]
    saveTreinos(updated)
    setTreinos(updated)
    setNome('')
    setShowForm(false)
    nav(`/treino/${novo.id}`)
  }

  function deleteTreino(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setConfirmDialog({
      message: 'Excluir este treino e todos os seus dados?',
      onConfirm: () => {
        const updated = treinos.filter(t => t.id !== id)
        saveTreinos(updated)
        setTreinos(updated)
      },
    })
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(exportData)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: seleciona o textarea manualmente
      const el = document.getElementById('export-textarea') as HTMLTextAreaElement
      el?.select()
    }
  }

  function restaurar() {
    setImportError('')
    try {
      const data = JSON.parse(importText.trim())
      if (!Array.isArray(data)) throw new Error()
      saveTreinos(data)
      setTreinos(data)
      setShowImport(false)
      setImportText('')
    } catch {
      setImportError('Texto inválido. Cole exatamente o que foi copiado pelo GymNotes.')
    }
  }

  return (
    <div className="flex flex-col min-h-dvh max-w-md mx-auto">
      <header className="sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur px-4 pt-safe pb-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Dumbbell size={22} className="text-brand" />
            <h1 className="text-xl font-bold tracking-tight">GymNotes</h1>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowExport(true)} title="Backup" className="p-2 text-white/30 hover:text-white/70">
              <Copy size={17} />
            </button>
            <button onClick={() => { setShowImport(true); setImportText(''); setImportError('') }} title="Restaurar" className="p-2 text-white/30 hover:text-white/70">
              <ClipboardPaste size={17} />
            </button>
          </div>
        </div>
        <p className="text-sm text-white/40">{treinos.length} treino{treinos.length !== 1 ? 's' : ''}</p>
      </header>

      <main className="flex-1 px-4 py-4 space-y-3">
        {treinos.length === 0 && !showForm && (
          <div className="text-center py-20 text-white/30">
            <Dumbbell size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum treino ainda</p>
            <p className="text-xs mt-1">Toque em + para criar</p>
          </div>
        )}

        {treinos.map(t => {
          const streak = calcStreak(t.sessoes)
          const thisWeek = sessionsThisWeek(t.sessoes)
          return (
            <button
              key={t.id}
              onClick={() => nav(`/treino/${t.id}`)}
              className="w-full flex items-center gap-3 bg-[#1a1a1a] border border-white/8 rounded-2xl px-4 py-4 text-left active:scale-[.98] transition-transform"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{t.nome}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-white/35">
                    {t.exercicios.length} ex · {t.sessoes.length} sess{t.sessoes.length !== 1 ? 'ões' : 'ão'}
                  </span>
                  {streak > 0 && (
                    <span className="flex items-center gap-0.5 text-xs font-bold text-orange-400">
                      <Flame size={11} />
                      {streak} sem
                    </span>
                  )}
                  {thisWeek > 0 && (
                    <span className="text-xs font-semibold text-brand/80">
                      {thisWeek} esta sem
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => deleteTreino(t.id, e)}
                className="p-2 rounded-xl text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-colors"
              >
                <Trash2 size={16} />
              </button>
              <ChevronRight size={18} className="text-white/20 shrink-0" />
            </button>
          )
        })}
      </main>

      {/* Modal Exportar */}
      {showExport && (
        <div className="fixed inset-0 bg-black/70 flex items-end z-50" onClick={() => setShowExport(false)}>
          <div className="w-full max-w-md mx-auto bg-[#1a1a1a] rounded-t-3xl p-6 pb-10 space-y-4" onClick={e => e.stopPropagation()}>
            <div>
              <p className="font-bold text-lg">Backup dos dados</p>
              <p className="text-xs text-white/40 mt-1">Copie o texto abaixo e salve em qualquer lugar (Notes, WhatsApp pra si mesmo, etc). Para restaurar, cole no botão de importar.</p>
            </div>
            <textarea
              id="export-textarea"
              readOnly
              value={exportData}
              rows={5}
              onClick={e => (e.target as HTMLTextAreaElement).select()}
              className="w-full bg-[#252525] border border-white/10 rounded-xl px-3 py-3 text-white/60 text-xs outline-none resize-none font-mono"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowExport(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-medium">
                Fechar
              </button>
              <button
                onClick={copiar}
                className={`flex-1 py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors ${copied ? 'bg-green-500' : 'bg-brand'}`}
              >
                {copied ? <><Check size={15} /> Copiado!</> : <><Copy size={15} /> Copiar tudo</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Importar */}
      {showImport && (
        <div className="fixed inset-0 bg-black/70 flex items-end z-50" onClick={() => setShowImport(false)}>
          <div className="w-full max-w-md mx-auto bg-[#1a1a1a] rounded-t-3xl p-6 pb-10 space-y-4" onClick={e => e.stopPropagation()}>
            <div>
              <p className="font-bold text-lg">Restaurar dados</p>
              <p className="text-xs text-white/40 mt-1">Cole aqui o texto copiado pelo backup.</p>
            </div>
            <textarea
              value={importText}
              onChange={e => { setImportText(e.target.value); setImportError('') }}
              placeholder="Cole o backup aqui..."
              rows={5}
              className="w-full bg-[#252525] border border-white/10 rounded-xl px-3 py-3 text-white/80 placeholder-white/20 text-xs outline-none focus:border-brand resize-none font-mono"
            />
            {importError && <p className="text-xs text-red-400">{importError}</p>}
            <div className="flex gap-3">
              <button onClick={() => setShowImport(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-medium">
                Cancelar
              </button>
              <button
                onClick={restaurar}
                disabled={!importText.trim()}
                className="flex-1 py-3 rounded-xl bg-brand text-white text-sm font-bold disabled:opacity-30"
              >
                Restaurar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo treino */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-end z-50" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md mx-auto bg-[#1a1a1a] rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
            <p className="font-bold text-lg mb-4">Novo treino</p>
            <input
              autoFocus
              value={nome}
              onChange={e => setNome(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTreino()}
              placeholder="Ex: Treino A — Peito e Tríceps"
              className="w-full bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-brand"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-medium">
                Cancelar
              </button>
              <button onClick={addTreino} className="flex-1 py-3 rounded-xl bg-brand text-white text-sm font-bold">
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog(null) }}
          onCancel={() => setConfirmDialog(null)}
          confirmLabel="Excluir"
        />
      )}

      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-6 right-1/2 translate-x-1/2 max-w-md w-[calc(100%-2rem)] mx-auto flex items-center justify-center gap-2 bg-brand text-white rounded-2xl py-4 text-sm font-bold shadow-lg shadow-brand/30 active:scale-[.97] transition-transform"
      >
        <Plus size={20} />
        Novo Treino
      </button>
      <div className="h-24" />
    </div>
  )
}
