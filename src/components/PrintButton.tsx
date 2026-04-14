"use client"

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="text-xs tracking-widest uppercase font-body bg-olive hover:bg-olive/80 text-bone px-4 py-2.5 rounded-md transition"
    >
      Print / Save as PDF
    </button>
  )
}
