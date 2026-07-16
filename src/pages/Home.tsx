import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dumbbell, Plus, ChevronRight, Trash2, Download, Upload } from 'lucide-react'
import { getTreinos, saveTreinos, uid } from '../store'
import ConfirmDialog from '../components/ConfirmDialog'

export default function Home() {
  const [treinos, setTreinos] = useState(getTreinos)
  const [nome, setNome] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null)
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const nav = useNavigate()

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

  function exportar() {
    const raw = localStorage.getItem('gymnotes_treinos') ?? '[]'
    const blob = new Blob([raw], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gymnotes_backup_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (!Array.isArray(data)) throw new Error()
        saveTreinos(data)
        setTreinos(data)
        setImportMsg({ ok: true, text: `${data.length} treino${data.length !== 1 ? 's' : ''} importado${data.length !== 1 ? 's' : ''} com sucesso!` })
      } catch {
        setImportMsg({ ok: false, text: 'Arquivo inválido. Use um backup exportado pelo GymNotes.' })
      }
    }
    reader.readAsText(file)
    e.target.value = ''
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
            <button onClick={exportar} title="Exportar backup" className="p-2 text-white/30 hover:text-white/70">
              <Download size={18} />
            </button>
            <button onClick={() => fileRef.current?.click()} title="Importar backup" className="p-2 text-white/30 hover:text-white/70">
              <Upload size={18} />
            </button>
            <input ref={fileRef} type="file" accept=".json" onChange={importar} className="hidden" />
          </div>
        </div>
        <p className="text-sm text-white/40">{treinos.length} treino{treinos.length !== 1 ? 's' : ''}</p>
      </header>

      <main className="flex-1 px-4 py-4 space-y-3">
        {importMsg && (
          <div className={`rounded-2xl px-4 py-3 text-sm font-medium ${importMsg.ok ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
            {importMsg.text}
            <button onClick={() => setImportMsg(null)} className="ml-3 text-xs opacity-60">✕</button>
          </div>
        )}

        {treinos.length === 0 && !showForm && (
          <div className="text-center py-20 text-white/30">
            <Dumbbell size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum treino ainda</p>
            <p className="text-xs mt-1">Toque em + para criar</p>
          </div>
        )}

        {treinos.map(t => (
          <button
            key={t.id}
            onClick={() => nav(`/treino/${t.id}`)}
            className="w-full flex items-center gap-3 bg-[#1a1a1a] border border-white/8 rounded-2xl px-4 py-4 text-left active:scale-[.98] transition-transform"
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{t.nome}</p>
              <p className="text-xs text-white/40 mt-0.5">
                {t.exercicios.length} exercício{t.exercicios.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={(e) => deleteTreino(t.id, e)}
              className="p-2 rounded-xl text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <Trash2 size={16} />
            </button>
            <ChevronRight size={18} className="text-white/20 shrink-0" />
          </button>
        ))}
      </main>

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
