export type Category = "focal" | "filler" | "greenery" | "accent"

export type SeasonStatus = "in_season" | "shoulder" | "out_of_season"

export type LeadStatus = "new" | "contacted" | "proposal_sent" | "booked" | "completed"

export type SourceLocation = "local" | "california" | "dutch" | "south_america" | "other"

export type VibeTag =
  | "romantic"
  | "garden"
  | "modern"
  | "moody"
  | "boho"
  | "classic"
  | "tropical"
  | "minimalist"

export interface Flower {
  id: string
  common_name: string
  category: Category
  color_tags: string[] | null
  in_season_months: number[]
  shoulder_months: number[] | null
  stems_per_bunch_default: number
  notes: string | null
  // V2 fields (migration 021)
  default_source_location: SourceLocation | null
  vibe_tags_json: VibeTag[]
  created_at: string
}

export interface Event {
  id: string
  user_id: string
  name: string
  event_date: string
  // Planning fields — added in migration 010
  wedding_party_pairs: number
  guest_count: number
  ceremony_tier: string
  reception_tier: string
  guests_per_table: number
  // V2 fields (migration 020)
  inquiry_id: string | null
  lead_status: LeadStatus
  client_name: string | null
  client_email: string | null
  client_phone: string | null
  venue: string | null
  budget_cents: number | null
  vibe_tags_json: VibeTag[]
  created_at: string
}

export interface EventItem {
  id: string
  event_id: string
  flower_id: string
  quantity: number
  stems: number
  notes: string | null
  created_at: string
}

// Joined shape used on the event detail page
export interface EventItemWithFlower extends EventItem {
  flower: Flower
}

export interface UserFlowerPref {
  id: string
  user_id: string
  flower_id: string
  stems_per_bunch_override: number
  created_at: string
}

// ── V2 types ──────────────────────────────────────────────────────────────────

export interface ClientInquiry {
  id: string
  florist_id: string
  client_name: string
  email: string
  phone: string | null
  event_date: string
  venue: string | null
  budget_cents: number | null
  event_type: "wedding" | "corporate" | "other"
  deliverables_json: string[]
  notes: string | null
  vibe_tags_json: VibeTag[]
  status: LeadStatus
  submitted_at: string
}

export interface FloristProfile {
  user_id: string
  slug: string
  business_name: string | null
  bio: string | null
  contact_email: string | null
  contact_phone: string | null
  location: string | null
  instagram_url: string | null
  is_portal_live: boolean
  created_at: string
  updated_at: string
}

export interface GalleryItem {
  id: string
  florist_id: string
  storage_path: string
  caption: string | null
  vibe_tags_json: VibeTag[]
  event_date: string | null
  is_visible: boolean
  sort_order: number
  created_at: string
}

export interface RecipeDefault {
  id: string
  user_id: string
  deliverable_type: string
  focal_count: number
  filler_count: number
  green_count: number
  accent_count: number
  updated_at: string
}

export interface EventRecipe {
  id: string
  event_id: string
  deliverable_type: string
  quantity: number
  focal_count: number
  filler_count: number
  green_count: number
  accent_count: number
  locked_at: string | null
  created_at: string
}

export interface Supplier {
  id: string
  user_id: string
  name: string
  source_location: SourceLocation
  contact_info: string | null
  notes: string | null
  created_at: string
}

export interface FlowerSupplierPrice {
  id: string
  user_id: string
  flower_id: string
  supplier_id: string
  price_per_stem_cents: number
  bunch_size: number | null
  recorded_at: string
  event_id: string | null
}
