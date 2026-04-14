"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { ParsedAvailability, WholesalerMatch, MatchStatus } from "@/src/lib/wholesaler/types"
import type { ParseWholesalerResult, ConfirmWholesalerResult } from "@/src/lib/wholesaler/parseWholesalerAction"

interface CatalogFlower {
  id: string
  common_name: string
}

interface Props {
  parseAction: (rawText: string) => Promise<ParseWholesalerResult>
  confirmAction: (payload: {
    rawText: string
    confirmedMatches: Array<{
      rawLine: string
      catalogFlowerId: string
      confidenceScore: number
      sourceText: string
    }>
  }) => Promise<ConfirmWholesalerResult>
  catalog: CatalogFlower[]
  lastPaste: { created_at: string; raw_text: string } | null
}

type Step = "input" | "preview" | "done"

const STATUS_COLORS: Record<MatchStatus, string> = {
  exact:     "bg-green-50 text-green-700 border-green-200",
  partial:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  unmatched: "bg-gray-50 text-gray-500 border-gray-200",
}

const STATUS_LABEL: Record<MatchStatus, string> = {
  exact:     "Matched",
  partial:   "Partial",
  unmatched: "Unmatched",
}

export function AvailabilityPanel({ parseAction, confirmAction, catalog, lastPaste }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<Step>("input")
  const [text, setText] = useState(lastPaste?.raw_text ?? "")
  const [parsed, setParsed] = useState<ParsedAvailability | null>(null)
  const [overrides, setOverrides] = useState<Record<number, string | null>>({})
  const [saveResult, setSaveResult] = useState<ConfirmWholesalerResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isParsing, startParse] = useTransition()
  const [isSaving, startSave] = useTransition()

  const lastUpdated = lastPaste
    ? new Date(lastPaste.created_at).toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
        hour: "numeric", minute: "2-digit",
      })
    : null

  function handleParse() {
    if (!text.trim()) return
    setError(null)
    startParse(async () => {
      const result = await parseAction(text)
      if (!result.success || !result.parsed) {
        setError(result.message ?? "Parse failed")
        return
      }
      setParsed(result.parsed)
      setOverrides({})
      setStep("preview")
    })
  }

  function resolvedFlowerId(match: WholesalerMatch, idx: number): string | null {
    if (idx in overrides) return overrides[idx]
    return match.catalogFlowerId
  }

  function resolvedStatus(match: WholesalerMatch, idx: number): MatchStatus {
    if (idx in overrides) return overrides[idx] ? "exact" : "unmatched"
    return match.status
  }

  function handleConfirm() {
    if (!parsed) return
    startSave(async () => {
      const confirmedMatches = parsed.matches
        .map((m, idx) => ({
          rawLine: m.rawLine,
          catalogFlowerId: resolvedFlowerId(m, idx),
          confidenceScore: resolvedStatus(m, idx) === "exact" ? 1.0 : m.confidenceScore,
          sourceText: m.rawLine,
        }))
        .filter((m) => m.catalogFlowerId !== null) as Array<{
          rawLine: string
          catalogFlowerId: string
          confidenceScore: number
          sourceText: string
        }>

      const result = await confirmAction({ rawText: text, confirmedMatches })
      setSaveResult(result)
      if (result.success) {
        setStep("done")
        router.refresh()
      } else {
        setError(result.message ?? "Save failed")
      }
    })
  }

  // ── Step: input ────────────────────────────────────────────────────────────

  if (step === "input") {
    return (
      <div>
        {lastPaste ? (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6 text-sm">
            <p className="text-gray-500">
              Last updated:{" "}
              <span className="font-medium text-gray-700">{lastUpdated}</span>
            </p>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6 text-sm text-amber-800">
            No availability data saved yet — flowers will not show "Available now" badges.
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Paste your wholesaler availability list
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              placeholder={"Garden Rose - 12 bunches - $4.50\nPeony\nSunflower, Lavender"}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 font-mono resize-y"
            />
            <p className="mt-1.5 text-xs text-gray-400">
              One item per line. Formats like "Rose - 10 bunches - $4.50" are parsed automatically.
            </p>
          </div>

          <button
            onClick={handleParse}
            disabled={!text.trim() || isParsing}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-md transition"
          >
            {isParsing ? "Parsing…" : "Parse Availability"}
          </button>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>
    )
  }

  // ── Step: preview ──────────────────────────────────────────────────────────

  if (step === "preview" && parsed) {
    const { summary } = parsed

    return (
      <div>
        <div className="flex items-center gap-4 mb-5 text-sm">
          <span className="text-green-700 font-medium">{summary.exact} matched</span>
          <span className="text-yellow-600 font-medium">{summary.partial} partial</span>
          <span className="text-gray-400">{summary.unmatched} unmatched</span>
          <button
            onClick={() => { setStep("input"); setParsed(null) }}
            className="ml-auto text-xs text-gray-400 hover:text-gray-600"
          >
            ← Edit text
          </button>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden mb-5">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Raw line</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Status</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Catalog match</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {parsed.matches.map((match, idx) => {
                const status = resolvedStatus(match, idx)
                const flowerId = resolvedFlowerId(match, idx)
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-700 font-mono max-w-[200px] truncate" title={match.rawLine}>
                      {match.rawLine}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs border ${STATUS_COLORS[status]}`}>
                        {STATUS_LABEL[status]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        value={flowerId ?? ""}
                        onChange={(e) =>
                          setOverrides((prev) => ({ ...prev, [idx]: e.target.value || null }))
                        }
                        className="w-full border border-gray-200 rounded px-2 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-green-500"
                      >
                        <option value="">— unmatched —</option>
                        {catalog.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.common_name}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleConfirm}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-md transition"
          >
            {isSaving ? "Saving…" : "Confirm & Save"}
          </button>
          <p className="text-xs text-gray-400">Only matched rows will be saved.</p>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    )
  }

  // ── Step: done ─────────────────────────────────────────────────────────────

  if (step === "done" && saveResult) {
    const unmatched = parsed ? parsed.summary.unmatched : 0
    return (
      <div>
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4 text-sm text-green-800">
          <p className="font-medium">
            {saveResult.savedCount} flower{saveResult.savedCount !== 1 ? "s" : ""} marked as available
          </p>
          {parsed && (
            <p className="text-xs text-green-700 mt-1">
              {parsed.summary.exact} matched · {parsed.summary.partial} partial · {unmatched} unmatched
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => { setStep("input"); setSaveResult(null); setParsed(null) }}
            className="text-sm text-gray-500 hover:text-gray-800 border border-gray-200 px-4 py-2 rounded-md transition"
          >
            Paste new availability
          </button>
        </div>
      </div>
    )
  }

  return null
}
