"use client"

import { useState, useTransition } from "react"
import { saveSupplier, deleteSupplier } from "@/src/lib/save-supplier-action"

const SOURCE_LOCATIONS = [
  { value: "local",         label: "Local Farm" },
  { value: "california",    label: "California" },
  { value: "dutch",         label: "Dutch Import" },
  { value: "south_america", label: "South America" },
  { value: "other",         label: "Other" },
]

interface Supplier {
  id: string
  name: string
  source_location: string
  contact_info: string | null
  notes: string | null
}

interface Props {
  suppliers: Supplier[]
}

function AddSupplierForm() {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    const form = e.currentTarget

    startTransition(async () => {
      const result = await saveSupplier(formData)
      if (result.success) {
        form.reset()
        setOpen(false)
      } else {
        setError(result.error ?? "Failed to save supplier.")
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-body text-green-700 hover:underline"
      >
        + Add Supplier
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-bone border border-hairline rounded-lg p-4 space-y-3 mt-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs tracking-widest uppercase font-body text-brown-muted mb-1">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            name="name"
            required
            type="text"
            placeholder="SLC Wholesale Flowers"
            className="w-full border border-hairline rounded-md px-3 py-1.5 text-sm font-body text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-green-600/40"
          />
        </div>
        <div>
          <label className="block text-xs tracking-widest uppercase font-body text-brown-muted mb-1">
            Source
          </label>
          <select
            name="source_location"
            defaultValue="other"
            className="w-full border border-hairline rounded-md px-3 py-1.5 text-sm font-body text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-green-600/40"
          >
            {SOURCE_LOCATIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs tracking-widest uppercase font-body text-brown-muted mb-1">
          Contact Info
        </label>
        <input
          name="contact_info"
          type="text"
          placeholder="email or phone"
          className="w-full border border-hairline rounded-md px-3 py-1.5 text-sm font-body text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-green-600/40"
        />
      </div>
      <div>
        <label className="block text-xs tracking-widest uppercase font-body text-brown-muted mb-1">
          Notes
        </label>
        <input
          name="notes"
          type="text"
          placeholder="Lead time, minimums, etc."
          className="w-full border border-hairline rounded-md px-3 py-1.5 text-sm font-body text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-green-600/40"
        />
      </div>
      {error && <p className="text-xs text-red-600 font-body">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="text-sm font-body bg-charcoal text-bone px-4 py-1.5 rounded-md hover:bg-charcoal/80 transition disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Add Supplier"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm font-body text-brown-muted hover:text-charcoal"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export function SupplierManagement({ suppliers }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteSupplier(id)
    })
  }

  return (
    <div className="space-y-2">
      {suppliers.length === 0 ? (
        <p className="text-sm font-body italic text-brown-muted mb-3">
          No suppliers yet. Add your first one below.
        </p>
      ) : (
        <div className="space-y-2 mb-3">
          {suppliers.map((supplier) => {
            const locLabel = SOURCE_LOCATIONS.find((s) => s.value === supplier.source_location)?.label ?? supplier.source_location
            return (
              <div
                key={supplier.id}
                className="flex items-center justify-between bg-bone border border-hairline rounded-lg px-4 py-3"
              >
                <div>
                  <span className="text-sm font-body text-charcoal font-medium">{supplier.name}</span>
                  <span className="ml-2 text-xs font-body text-brown-muted">{locLabel}</span>
                  {supplier.contact_info && (
                    <p className="text-xs font-body italic text-brown-muted mt-0.5">{supplier.contact_info}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(supplier.id)}
                  disabled={isPending}
                  className="text-xs font-body text-brown-muted hover:text-red-600 transition disabled:opacity-40"
                  aria-label={`Delete ${supplier.name}`}
                >
                  Remove
                </button>
              </div>
            )
          })}
        </div>
      )}
      <AddSupplierForm />
    </div>
  )
}
