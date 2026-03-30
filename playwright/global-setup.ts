/**
 * Playwright global setup — runs once before all test suites.
 * 1. Signs in as the test user via /api/test-auth
 * 2. Saves session cookies to playwright/.auth/user.json
 * 3. Seeds minimum test data for the test user via Supabase admin
 */
import { chromium, FullConfig } from "@playwright/test"
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(__dirname, "../.env.test") })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const TEST_USER_ID = process.env.TEST_USER_ID!
const TEST_AUTH_SECRET = process.env.TEST_AUTH_SECRET!
const BASE_URL = "http://localhost:3000"

async function seedTestData() {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  // Florist profile for portal tests
  await admin.from("florist_profiles").upsert({
    user_id: TEST_USER_ID,
    slug: "test-flora",
    business_name: "Test Flora Studio",
    bio: "A test florist for automated testing.",
    contact_email: "test@fauna.dev",
    is_portal_live: true,
  }, { onConflict: "user_id" })

  // Pricing settings
  await admin.from("user_pricing_settings").upsert({
    user_id: TEST_USER_ID,
    tax_rate: 0.08,
    target_margin: 0.60,
  }, { onConflict: "user_id" })

  // Seed a known test event (used by event-flow tests)
  const { data: existing } = await admin
    .from("events")
    .select("id")
    .eq("user_id", TEST_USER_ID)
    .eq("name", "__test_event__")
    .maybeSingle()

  if (!existing) {
    await admin.from("events").insert({
      user_id: TEST_USER_ID,
      name: "__test_event__",
      event_date: "2027-06-15",
      lead_status: "new",
      client_name: "Test Client",
      client_email: "client@test.com",
    })
  }

  console.log("[global-setup] Test data seeded ✓")
}

async function globalSetup(config: FullConfig) {
  await seedTestData()

  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  // Hit the test-auth endpoint — it sets the @supabase/ssr session cookies
  const response = await page.request.get(`${BASE_URL}/api/test-auth`, {
    headers: { "x-test-secret": TEST_AUTH_SECRET },
  })

  if (!response.ok()) {
    const body = await response.text()
    throw new Error(`[global-setup] Auth failed (${response.status()}): ${body}`)
  }

  const json = await response.json() as { success: boolean; userId: string }
  console.log(`[global-setup] Authenticated as ${json.userId} ✓`)

  // The request context has the cookies — save them as browser storage state
  await context.storageState({ path: "playwright/.auth/user.json" })
  await browser.close()

  console.log("[global-setup] Auth state saved ✓")
}

export default globalSetup
