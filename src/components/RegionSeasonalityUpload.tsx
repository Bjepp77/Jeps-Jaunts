"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import type { ImportResult, ImportRowError } from "@/src/lib/import-seasonality-action"

interface LastImport {
  filename: string
  uploaded_at: string
  row_count: number
  errors: ImportRowError[]
}

interface Props {
  importAction: (formData: FormData) => Promise<ImportResult>
  lastImport: LastImport | null
  overrideCount: number
}

export function RegionSeasonalityUpload({ importAction, lastImport, overrideCount }: Props) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setResult(null)
    const formData = new FormData()
    formData.set("csv_file", file)
    const res = await importAction(formData)
    setResult(res)
    setLoading(false)
    if (res.success) {
      setFile(null)
      if (inputRef.current) inputRef.current.value = ""
      router.refresh()
    }
  }

  const lastImportDate = lastImport
    ? new Date(lastImport.uploaded_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null

  return (
    <div>
      {/* Last import status */}
      {lastImport ? (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6 text-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium text-gray-700 truncate">{lastImport.filename}</p>
              <p className="text-gray-500 mt-0.5">
                {lastImport.row_count} flower{lastImport.row_count !== 1 ? "s" : ""} updated
                {lastImport.errors.length > 0 && (
                  <span className="text-yellow-600">
                    {" "}· {lastImport.errors.length} row{lastImport.errors.length !== 1 ? "s" : ""} skipped
                  </span>
                )}
              </p>
              {overrideCount > 0 && (
                <p className="text-green-600 mt-0.5">
                  {overrideCount} flower{overrideCount !== 1 ? "s" : ""} currently using Utah data
                </p>
              )}
            </div>
            <span className="text-xs text-gray-400 shrink-0">{lastImportDate}</span>
          </div>

          {/* Previous import errors */}
          {lastImport.errors.length > 0 && (
            <details className="mt-3 border-t border-gray-200 pt-3">
              <summary className="text-xs text-yellow-700 cursor-pointer">
                {lastImport.errors.length} rows were skipped last upload
              </summary>
              <ul className="mt-2 space-y-0.5 text-xs text-yellow-800">
                {lastImport.errors.map((e, i) => (
                  <li key={i}>
                    Row {e.row}: {e.message}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6 text-sm text-amber-800">
          No Utah seasonality data uploaded yet — all events are using global defaults.
        </div>
      )}

      {/* Upload form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            CSV file
          </label>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100 transition"
          />
          <p className="mt-2 text-xs text-gray-400">
            Required columns: <code className="bg-gray-100 px-1 rounded">flower_name</code>,{" "}
            <code className="bg-gray-100 px-1 rounded">in_season_months</code> · Optional:{" "}
            <code className="bg-gray-100 px-1 rounded">shoulder_months</code>
            <br />
            Months as numbers (1–12) or names (Jan–Dec), space- or comma-separated.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!file || loading}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-md transition"
          >
            {loading ? "Uploading…" : "Upload CSV"}
          </button>
          <a
            href="/api/seasonality-template"
            download
            className="text-sm text-gray-500 hover:text-gray-800 transition"
          >
            Download blank template
          </a>
        </div>
      </form>

      {/* Upload result */}
      {result && (
        <div
          className={`mt-4 rounded-md p-4 text-sm ${
            result.success
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          {result.success ? (
            <>
              <p className="font-medium text-green-800">
                {result.rowsUpdated} flower{result.rowsUpdated !== 1 ? "s" : ""} updated
                {result.rowsSkipped > 0 && `, ${result.rowsSkipped} skipped`}
              </p>
              {result.errors.length > 0 && (
                <details className="mt-2">
                  <summary className="text-yellow-700 cursor-pointer text-xs">
                    {result.errors.length} row{result.errors.length !== 1 ? "s" : ""} had issues
                  </summary>
                  <ul className="mt-1 space-y-0.5 text-xs text-yellow-800">
                    {result.errors.map((e, i) => (
                      <li key={i}>
                        Row {e.row}: {e.message}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </>
          ) : (
            <p className="text-red-800">{result.message || "Upload failed."}</p>
          )}
        </div>
      )}

      {/* Format reference */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
          CSV Format
        </p>
        <pre className="bg-gray-50 border border-gray-200 rounded-md p-3 text-xs text-gray-600 font-mono overflow-x-auto leading-relaxed">
{`flower_name,in_season_months,shoulder_months
Garden Rose,4 5 6 7 8 9,3 10
Peony,5 6,4 7
Sunflower,7 8 9,6 10
Lavender,6 7 8,5 9
Anemone,Mar Apr May,Feb Jun`}
        </pre>
        <p className="mt-2 text-xs text-gray-400">
          Flower names must match exactly (case-insensitive). Use "Download blank
          template" above to get a pre-filled file with all flower names.
        </p>
      </div>
    </div>
  )
}
