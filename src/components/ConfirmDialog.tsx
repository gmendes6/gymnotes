type Props = {
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  danger?: boolean
}

export default function ConfirmDialog({ message, onConfirm, onCancel, confirmLabel = 'Confirmar', danger = true }: Props) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] px-6" onClick={onCancel}>
      <div className="w-full max-w-xs bg-[#1a1a1a] border border-white/10 rounded-2xl p-5" onClick={e => e.stopPropagation()}>
        <p className="text-white text-sm font-medium text-center leading-relaxed">{message}</p>
        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold ${danger ? 'bg-red-500' : 'bg-brand'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
