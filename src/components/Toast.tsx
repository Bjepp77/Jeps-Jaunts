"use client"

import { createContext, useCallback, useContext, useRef, useState } from "react"

interface ToastAction {
  label: string
  onClick: () => void
}

interface ToastItem {
  id: number
  message: string
  action?: ToastAction
}

interface ToastContextValue {
  showToast: (message: string, options?: { action?: ToastAction }) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const showToast = useCallback(
    (message: string, options?: { action?: ToastAction }) => {
      const id = ++counter.current
      setToasts((prev) => [...prev, { id, message, action: options?.action }])
      // Auto-dismiss after 5 s (enough for a 5 s undo window)
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 5500)
    },
    []
  )

  function dismiss(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast stack — centered at bottom */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-3 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg max-w-sm w-max"
          >
            <span>{toast.message}</span>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action!.onClick()
                  dismiss(toast.id)
                }}
                className="font-semibold text-green-400 hover:text-green-300 shrink-0"
              >
                {toast.action.label}
              </button>
            )}
            <button
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss"
              className="text-gray-400 hover:text-white shrink-0 leading-none text-base"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}
