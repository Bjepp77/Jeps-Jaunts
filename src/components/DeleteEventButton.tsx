"use client"

import { useState, useTransition } from "react"
import { ConfirmModal } from "./ConfirmModal"
import { useToast } from "./Toast"

interface Props {
  eventId: string
  eventName: string
  deleteAction: (formData: FormData) => Promise<void>
}

export function DeleteEventButton({ eventId, eventName, deleteAction }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { showToast } = useToast()

  function handleConfirm() {
    setShowModal(false)
    showToast(`"${eventName}" deleted`)
    const formData = new FormData()
    formData.set("id", eventId)
    startTransition(() => deleteAction(formData))
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={isPending}
        className="text-xs tracking-widest uppercase font-body text-brown-muted hover:text-dusty-rose px-3 py-1 mr-3 rounded transition disabled:opacity-40"
      >
        {isPending ? "Deleting…" : "Delete"}
      </button>

      {showModal && (
        <ConfirmModal
          title={`Delete "${eventName}"?`}
          message="This will permanently delete the event and all its flowers. This cannot be undone."
          confirmLabel="Delete event"
          onConfirm={handleConfirm}
          onCancel={() => setShowModal(false)}
        />
      )}
    </>
  )
}
