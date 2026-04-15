"use client"

import { useState, useMemo, useCallback, useTransition, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { DeliverablePanel } from "./DeliverablePanel"
import { FlowerBrowserPanel } from "./FlowerBrowserPanel"
import { RecipeCard } from "./RecipeCard"
import { saveRecipeItems } from "@/src/lib/recipe-actions"
import { addEventDeliverable } from "@/src/lib/add-event-deliverable-action"
import type { Flower, Category } from "@/src/types/database"
import type { AvailabilityOverride } from "@/src/lib/seasonality"
import type { Deliverable } from "./DeliverablePanel"
import type { RecipeFlower } from "./RecipeCard"

// ── Types ────────────────────────────────────────────────────────────────────

interface Props {
  eventId: string
  eventMonth: number
  deliverables: Deliverable[]
  flowers: Flower[]
  initialRecipes: Record<string, RecipeFlower[]>
  overrides?: Record<string, AvailabilityOverride>
  regionId?: string
}

type MobileTab = "deliverables" | "browse" | "recipe"

const MOBILE_TAB_LABELS: Record<MobileTab, string> = {
  deliverables: "Deliverables",
  browse: "Browse",
  recipe: "Recipe",
}

// ── Toast hook ───────────────────────────────────────────────────────────────

function useToast(duration = 2000) {
  const [message, setMessage] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback(
    (msg: string) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      setMessage(msg)
      timerRef.current = setTimeout(() => setMessage(null), duration)
    },
    [duration],
  )

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return { message, show }
}

// ── Component ────────────────────────────────────────────────────────────────

export function RecipeBuilder({
  eventId,
  eventMonth,
  deliverables,
  flowers,
  initialRecipes,
  overrides,
  regionId,
}: Props) {
  const router = useRouter()
  const [deliverableList, setDeliverableList] = useState<Deliverable[]>(deliverables)
  const [activeDeliverable, setActiveDeliverable] = useState(
    deliverables[0]?.type ?? ""
  )
  const [recipes, setRecipes] =
    useState<Record<string, RecipeFlower[]>>(initialRecipes)
  const [mobileTab, setMobileTab] = useState<MobileTab>("deliverables")
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const toast = useToast(2000)

  // ── Derived state ────────────────────────────────────────────────────────

  const activeRecipe = recipes[activeDeliverable] ?? []
  const activeFlowerIds = activeRecipe.map((r) => r.flower_id)
  const activeDeliverableData = deliverableList.find(
    (d) => d.type === activeDeliverable
  )
  const isLastDeliverable =
    deliverableList.findIndex((d) => d.type === activeDeliverable) ===
    deliverableList.length - 1

  // Running totals across all deliverables
  const runningTotals = useMemo(() => {
    const totals = { focal: 0, filler: 0, greenery: 0, accent: 0, total: 0 }
    for (const del of deliverableList) {
      const items = recipes[del.type] ?? []
      for (const item of items) {
        const cat = item.flower.category as Category
        const stems = item.stems_per_unit * del.quantity
        if (cat in totals) {
          totals[cat] += stems
        }
        totals.total += stems
      }
    }
    return totals
  }, [recipes, deliverableList])

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSelectDeliverable = useCallback((type: string) => {
    setActiveDeliverable(type)
    setSaved(false)
    setMobileTab("recipe")
  }, [])

  const handleAddFlower = useCallback(
    (flower: Flower) => {
      setRecipes((prev) => {
        const current = prev[activeDeliverable] ?? []
        if (current.some((r) => r.flower_id === flower.id)) return prev
        return {
          ...prev,
          [activeDeliverable]: [
            ...current,
            { flower_id: flower.id, flower, stems_per_unit: 3 },
          ],
        }
      })
      setSaved(false)
      // On mobile: stay on Browse tab and show toast
      const deliverableName =
        deliverableList.find((d) => d.type === activeDeliverable)?.display_name ??
        activeDeliverable
      toast.show(`Added ${flower.common_name} to ${deliverableName}`)
    },
    [activeDeliverable, deliverableList, toast]
  )

  const handleUpdateStems = useCallback(
    (flowerId: string, stems: number) => {
      setRecipes((prev) => ({
        ...prev,
        [activeDeliverable]: (prev[activeDeliverable] ?? []).map((r) =>
          r.flower_id === flowerId ? { ...r, stems_per_unit: stems } : r
        ),
      }))
      setSaved(false)
    },
    [activeDeliverable]
  )

  const handleRemoveFlower = useCallback(
    (flowerId: string) => {
      setRecipes((prev) => ({
        ...prev,
        [activeDeliverable]: (prev[activeDeliverable] ?? []).filter(
          (r) => r.flower_id !== flowerId
        ),
      }))
      setSaved(false)
    },
    [activeDeliverable]
  )

  function doSave() {
    startTransition(async () => {
      const items = (recipes[activeDeliverable] ?? []).map((r) => ({
        flower_id: r.flower_id,
        stems_per_unit: r.stems_per_unit,
      }))
      await saveRecipeItems(eventId, activeDeliverable, items)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    })
  }

  async function handleAddDeliverable(typeName: string, quantity: number) {
    const result = await addEventDeliverable(eventId, typeName, quantity)
    if (result.ok) {
      setDeliverableList((prev) => [
        ...prev,
        { type: result.typeName, display_name: result.displayName, quantity },
      ])
      setActiveDeliverable(result.typeName)
    }
  }

  function handleNext() {
    // Save current, then advance
    startTransition(async () => {
      const items = (recipes[activeDeliverable] ?? []).map((r) => ({
        flower_id: r.flower_id,
        stems_per_unit: r.stems_per_unit,
      }))
      await saveRecipeItems(eventId, activeDeliverable, items)

      const idx = deliverableList.findIndex(
        (d) => d.type === activeDeliverable
      )
      if (idx < deliverableList.length - 1) {
        setActiveDeliverable(deliverableList[idx + 1].type)
        setSaved(false)
        setMobileTab("browse")
      } else {
        // Last deliverable — navigate to pricing
        router.push(`/events/${eventId}/bom`)
      }
    })
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const deliverablePanel = (
    <DeliverablePanel
      deliverables={deliverableList}
      activeType={activeDeliverable}
      onSelect={handleSelectDeliverable}
      runningTotals={runningTotals}
      onAdd={handleAddDeliverable}
    />
  )

  const browserPanel = (
    <FlowerBrowserPanel
      flowers={flowers}
      eventMonth={eventMonth}
      addedFlowerIds={activeFlowerIds}
      onAdd={handleAddFlower}
      overrides={overrides}
      regionId={regionId}
    />
  )

  const recipeCard = (
    <RecipeCard
      deliverableName={activeDeliverableData?.display_name ?? ""}
      quantity={activeDeliverableData?.quantity ?? 1}
      items={activeRecipe}
      onUpdateStems={handleUpdateStems}
      onRemove={handleRemoveFlower}
      onSave={doSave}
      onNext={handleNext}
      isSaving={isPending}
      isLast={isLastDeliverable}
    />
  )

  return (
    <div>
      {/* ── Mobile: tabbed interface (below lg) ─────────────────────────────── */}
      <div className="lg:hidden">
        <div className="sticky top-12 z-20 bg-bone border-b border-hairline mb-4">
          <div className="flex">
            {(["deliverables", "browse", "recipe"] as MobileTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setMobileTab(tab)}
                className={`flex-1 min-h-[44px] py-4 text-sm font-body text-center transition ${
                  mobileTab === tab
                    ? "text-charcoal border-b-2 border-sage-600 font-medium"
                    : "text-brown-muted"
                }`}
              >
                {MOBILE_TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        </div>

        {mobileTab === "deliverables" && deliverablePanel}
        {mobileTab === "browse" && browserPanel}
        {mobileTab === "recipe" && recipeCard}
      </div>

      {/* ── Desktop: three-panel layout (lg and above) ──────────────────────── */}
      <div className="hidden lg:flex gap-6 items-start">
        {/* Left: Deliverables */}
        <aside className="w-64 xl:w-72 shrink-0 sticky top-4">
          {deliverablePanel}
        </aside>

        {/* Center: Flower Browser */}
        <div className="flex-1 min-w-0">{browserPanel}</div>

        {/* Right: Recipe Card */}
        <aside className="w-72 xl:w-80 shrink-0 sticky top-4">
          {recipeCard}
        </aside>
      </div>

      {/* Saved toast */}
      {saved && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-charcoal text-bone text-sm font-body px-5 py-2.5 rounded-lg shadow-lifted z-50 animate-pulse">
          Saved
        </div>
      )}

      {/* Add-flower toast (mobile) */}
      {toast.message && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-sage-600 text-bone text-sm font-body px-5 py-2.5 rounded-lg shadow-lifted z-50 lg:hidden">
          {toast.message}
        </div>
      )}
    </div>
  )
}
