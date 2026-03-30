import { redirect } from "next/navigation"
import Link from "next/link"
import { createSupabaseServer } from "@/src/lib/supabase-server"
import { RegionSeasonalityUpload } from "@/src/components/RegionSeasonalityUpload"
import { importSeasonalityCSV } from "@/src/lib/import-seasonality-action"
import type { ImportRowError } from "@/src/lib/import-seasonality-action"
import { AvailabilityPanel } from "@/src/components/AvailabilityPanel"
import { parseWholesalerAction, confirmWholesalerAction } from "@/src/lib/wholesaler/parseWholesalerAction"
import { BunchSizesTable } from "@/src/components/BunchSizesTable"
import { saveBunchOverride } from "@/src/lib/save-bunch-override-action"
import { PricingSettingsForm } from "@/src/components/PricingSettingsForm"
import { savePricingSettings } from "@/src/lib/save-pricing-settings-action"
import { FlowerCostsTable } from "@/src/components/FlowerCostsTable"
import { saveFlowerCost } from "@/src/lib/save-flower-cost-action"
import { getUserBillingSummary } from "@/src/lib/billing"
import { RecipeDefaultsForm } from "@/src/components/RecipeDefaultsForm"
import { FloristPortalSettings } from "@/src/components/FloristPortalSettings"
import { SupplierManagement } from "@/src/components/SupplierManagement"
import { GalleryManager } from "@/src/components/GalleryManager"

export default async function SettingsPage() {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // Utah region
  const { data: region } = await supabase
    .from("regions")
    .select("id, name")
    .eq("slug", "utah")
    .single()

  const { data: lastImport } = region
    ? await supabase
        .from("region_imports")
        .select("filename, uploaded_at, row_count, errors_json")
        .eq("region_id", region.id)
        .order("uploaded_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null }

  const { count: overrideCount } = region
    ? await supabase
        .from("region_flower_seasonality")
        .select("*", { count: "exact", head: true })
        .eq("region_id", region.id)
    : { count: 0 }

  const lastImportSafe = lastImport
    ? {
        filename: lastImport.filename as string,
        uploaded_at: lastImport.uploaded_at as string,
        row_count: lastImport.row_count as number,
        errors: (lastImport.errors_json ?? []) as ImportRowError[],
      }
    : null

  // Latest wholesaler paste
  const { data: activePaste } = await supabase
    .from("availability_pastes")
    .select("raw_text, created_at")
    .eq("user_id", user.id)
    .eq("scope", "global")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const lastPasteSafe = activePaste
    ? {
        raw_text: activePaste.raw_text as string,
        created_at: activePaste.created_at as string,
      }
    : null

  // Full flower catalog for wholesaler matching dropdowns
  const { data: allFlowers } = await supabase
    .from("flowers")
    .select("id, common_name, category, stems_per_bunch_default")
    .order("common_name")

  const catalog = (allFlowers ?? []).map((f) => ({
    id: f.id as string,
    common_name: f.common_name as string,
  }))

  // Bunch sizes
  const { data: userPrefs } = await supabase
    .from("user_flower_prefs")
    .select("flower_id, stems_per_bunch_override")
    .eq("user_id", user.id)

  const prefMap = new Map(
    (userPrefs ?? []).map((p) => [p.flower_id as string, p.stems_per_bunch_override as number])
  )

  const bunchFlowers = (allFlowers ?? []).map((f) => ({
    id: f.id as string,
    common_name: f.common_name as string,
    category: f.category as string,
    stems_per_bunch_default: (f.stems_per_bunch_default as number) ?? 10,
    stems_per_bunch_override: prefMap.get(f.id as string) ?? null,
  }))

  // Pricing settings
  const { data: pricingRow } = await supabase
    .from("user_pricing_settings")
    .select("tax_rate, target_margin")
    .eq("user_id", user.id)
    .maybeSingle()

  const pricingSettings = pricingRow
    ? {
        tax_rate: pricingRow.tax_rate as number,
        target_margin: pricingRow.target_margin as number,
      }
    : null

  // Flower costs
  const { data: flowerCostRows } = await supabase
    .from("user_flower_costs")
    .select("flower_id, cost_per_stem")
    .eq("user_id", user.id)

  const costMap = new Map(
    (flowerCostRows ?? []).map((r) => [r.flower_id as string, r.cost_per_stem as number])
  )

  const costFlowers = (allFlowers ?? []).map((f) => ({
    id: f.id as string,
    common_name: f.common_name as string,
    category: f.category as string,
    cost_per_stem: costMap.get(f.id as string) ?? null,
  }))

  // AI style sample count
  const { count: styleCount } = await supabase
    .from("user_proposal_styles")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  // Billing summary
  const billingSummary = await getUserBillingSummary(user.id)

  // ── V2: Recipe defaults ────────────────────────────────────────────────────
  const { data: recipeDefaultRows } = await supabase
    .from("recipe_defaults")
    .select("deliverable_type, focal_count, filler_count, green_count, accent_count")
    .eq("user_id", user.id)

  const recipeDefaults = (recipeDefaultRows ?? []) as {
    deliverable_type: string
    focal_count: number
    filler_count: number
    green_count: number
    accent_count: number
  }[]

  // ── V2: Florist portal profile ─────────────────────────────────────────────
  const { data: profileRow } = await supabase
    .from("florist_profiles")
    .select("slug, business_name, bio, contact_email, contact_phone, location, is_portal_live")
    .eq("user_id", user.id)
    .maybeSingle()

  const profile = profileRow
    ? {
        slug: profileRow.slug as string,
        business_name: profileRow.business_name as string | null,
        bio: profileRow.bio as string | null,
        contact_email: profileRow.contact_email as string | null,
        contact_phone: profileRow.contact_phone as string | null,
        location: profileRow.location as string | null,
        is_portal_live: profileRow.is_portal_live as boolean,
      }
    : null

  // ── V2: Gallery items ──────────────────────────────────────────────────────
  const { data: galleryRows } = await supabase
    .from("gallery_items")
    .select("id, storage_path, caption, vibe_tags_json, sort_order")
    .eq("florist_id", user.id)
    .order("sort_order", { ascending: true })

  const galleryItems = (galleryRows ?? []) as {
    id: string
    storage_path: string
    caption: string | null
    vibe_tags_json: string[]
    sort_order: number
  }[]

  // ── V2: Suppliers ──────────────────────────────────────────────────────────
  const { data: supplierRows } = await supabase
    .from("suppliers")
    .select("id, name, source_location, contact_info, notes")
    .eq("user_id", user.id)
    .order("name")

  const suppliers = (supplierRows ?? []) as {
    id: string
    name: string
    source_location: string
    contact_info: string | null
    notes: string | null
  }[]

  return (
    <main className="min-h-screen bg-bone">
      <div className="max-w-2xl mx-auto px-6 py-14">

        <div className="mb-10">
          <Link
            href="/events"
            className="text-xs tracking-widest uppercase font-body text-brown-muted hover:text-charcoal transition"
          >
            ← Events
          </Link>
          <p className="text-xs tracking-widest uppercase font-body text-brown-muted mt-6 mb-2">
            Studio
          </p>
          <h1 className="text-3xl font-display italic text-charcoal">
            Settings
          </h1>
        </div>

        {/* ── V2: Portal ───────────────────────────────────────────────────── */}
        <SettingsSection
          eyebrow="Client Portal"
          title="Your Public Portal"
          description="Set up your Fauna-hosted client page — where brides and planners browse your gallery and submit inquiries."
        >
          <FloristPortalSettings profile={profile} />
        </SettingsSection>

        {/* ── V2: Gallery ──────────────────────────────────────────────────── */}
        <SettingsSection
          eyebrow="Portfolio"
          title="Gallery"
          description="Upload photos of past events. Tag each with a vibe so clients can filter by aesthetic on your portal."
        >
          <GalleryManager items={galleryItems} />
        </SettingsSection>

        {/* ── V2: Recipe defaults ──────────────────────────────────────────── */}
        <SettingsSection
          eyebrow="Recipes"
          title="Default Stem Ratios"
          description="Set your default focal / filler / greens / accent counts per deliverable type. These pre-fill the Recipes screen on every event. Override per-event at any time."
        >
          <RecipeDefaultsForm defaults={recipeDefaults} />
        </SettingsSection>

        {/* ── V2: Suppliers ─────────────────────────────────────────────────── */}
        <SettingsSection
          eyebrow="Sourcing"
          title="Suppliers"
          description="Add your wholesale suppliers with their source location. These appear as options on the BOM so you can log which supplier and price you used per flower."
        >
          <SupplierManagement suppliers={suppliers} />
        </SettingsSection>

        <SettingsSection
          eyebrow="Finances"
          title="Pricing"
          description="Set your target gross margin and tax rate. These are used to calculate estimated retail prices on each event."
        >
          <PricingSettingsForm settings={pricingSettings} saveAction={savePricingSettings} />
        </SettingsSection>

        <SettingsSection
          eyebrow="Inventory"
          title="Flower Costs"
          description="Enter your wholesale cost per stem for each flower. These feed the cost estimates on each event page."
        >
          <FlowerCostsTable flowers={costFlowers} saveAction={saveFlowerCost} />
        </SettingsSection>

        <SettingsSection
          eyebrow="Sourcing"
          title="Wholesaler Availability"
          description="Paste your wholesaler's current availability list. Fauna parses it, scores each match, and lets you confirm before saving."
        >
          <AvailabilityPanel
            parseAction={parseWholesalerAction}
            confirmAction={confirmWholesalerAction}
            catalog={catalog}
            lastPaste={lastPasteSafe}
          />
        </SettingsSection>

        <SettingsSection
          eyebrow="Ordering"
          title="Bunch Sizes"
          description="Override how many stems are in a bunch for any flower. The export uses these values to calculate bunches to order."
        >
          <BunchSizesTable flowers={bunchFlowers} saveAction={saveBunchOverride} />
        </SettingsSection>

        <SettingsSection
          eyebrow="Seasonality"
          title="Utah Seasonality"
          description="Upload a CSV to set Utah-specific in-season and shoulder months for any flower. Region data takes priority over global defaults for all events."
        >
          <RegionSeasonalityUpload
            importAction={importSeasonalityCSV}
            lastImport={lastImportSafe}
            overrideCount={overrideCount ?? 0}
          />
        </SettingsSection>

        <SettingsSection
          eyebrow="AI"
          title="Writing Style"
          description="Fauna learns how you write from the edits you make to AI-generated proposals. The more events you complete, the more it sounds like you."
        >
          {(styleCount ?? 0) === 0 ? (
            <p className="text-sm font-body italic text-brown-muted">
              No style samples yet. Generate an AI draft on any proposal, edit it, and save — Fauna will start learning your voice.
            </p>
          ) : (
            <p className="text-sm font-body text-charcoal">
              <span className="font-medium">{styleCount}</span> event{styleCount !== 1 ? "s" : ""} learned.
              Your writing style is shaping every new AI draft.
            </p>
          )}
        </SettingsSection>

        <SettingsSection
          eyebrow="Account"
          title="Billing"
          description={`${billingSummary.total} event${billingSummary.total !== 1 ? "s" : ""} exported · ${billingSummary.thisMonth} this month`}
        >
          <Link
            href="/settings/billing"
            className="inline-block text-sm font-body text-green-700 hover:underline"
          >
            View billing dashboard →
          </Link>
        </SettingsSection>

        {/* ── V2: Privacy trust statement ──────────────────────────────────── */}
        <SettingsSection
          eyebrow="Privacy"
          title="Your Data Is Yours"
          description=""
          last
        >
          <p className="text-sm font-body text-charcoal leading-relaxed">
            Your pricing, your clients, and your supplier data are private to your account.
            No other florist can see them. <strong>Fauna does not aggregate or sell your business data.</strong>
          </p>
          <p className="text-xs font-body italic text-brown-muted mt-3">
            Your portal. Your data. Your business.
          </p>
          <div className="mt-4 pt-4 border-t border-hairline">
            <Link
              href="/contribute"
              className="inline-block text-sm font-body text-green-700 hover:underline"
            >
              Help improve Fauna&apos;s flower data →
            </Link>
          </div>
        </SettingsSection>

      </div>
    </main>
  )
}

// ── Section card ──────────────────────────────────────────────────────────────

function SettingsSection({
  eyebrow,
  title,
  description,
  children,
  last = false,
}: {
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
  last?: boolean
}) {
  return (
    <div className={`bg-section border border-hairline rounded-xl shadow-paper px-8 py-8 ${last ? "" : "mb-6"}`}>
      <p className="text-xs tracking-widest uppercase font-body text-brown-muted mb-1">
        {eyebrow}
      </p>
      <h2 className="text-xl font-display italic text-charcoal mb-2">
        {title}
      </h2>
      {description && (
        <p className="text-sm font-body italic text-brown-mid leading-relaxed mb-6">
          {description}
        </p>
      )}
      {children}
    </div>
  )
}
