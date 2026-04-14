"use client"

interface Props {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-charcoal/30" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative bg-bone border border-hairline rounded-xl shadow-lifted max-w-sm w-full p-6">
        <h2 className="text-lg font-display italic text-charcoal mb-2">{title}</h2>
        <p className="text-sm font-body italic text-brown-mid mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="text-xs tracking-widest uppercase font-body text-brown-mid hover:text-charcoal px-4 py-2 rounded-md border border-hairline hover:border-charcoal/20 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="text-xs tracking-widest uppercase font-body bg-olive hover:bg-olive/80 text-bone px-4 py-2 rounded-md transition"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
