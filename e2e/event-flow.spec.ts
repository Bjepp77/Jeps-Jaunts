/**
 * E2E: Event flow stepper — Setup → Recipes → Price → Contract
 * Uses the seeded __test_event__ for stable, repeatable tests.
 */
import { test, expect } from "@playwright/test"
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const TEST_USER_ID = process.env.TEST_USER_ID!

async function getTestEventId(): Promise<string> {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  const { data } = await admin
    .from("events")
    .select("id")
    .eq("user_id", TEST_USER_ID)
    .eq("name", "__test_event__")
    .single()
  if (!data) throw new Error("Test event not found — run global setup")
  return data.id as string
}

test.describe("Event flow stepper", () => {
  test("Setup step — shows event name and all stepper steps", async ({ page }) => {
    const id = await getTestEventId()
    await page.goto(`/events/${id}/flow/setup`)
    await expect(page).toHaveURL(/\/flow\/setup/)
    // Event name displayed on page
    await expect(page.getByText("__test_event__").first()).toBeVisible()
    // All 4 stepper steps visible
    await expect(page.locator("text=Setup").first()).toBeVisible()
    await expect(page.locator("text=Recipes").first()).toBeVisible()
    await expect(page.locator("text=Price").first()).toBeVisible()
    await expect(page.locator("text=Contract").first()).toBeVisible()
  })

  test("Recipes step — loads on correct URL", async ({ page }) => {
    const id = await getTestEventId()
    await page.goto(`/events/${id}/flow/recipes`)
    await expect(page).toHaveURL(/\/flow\/recipes/)
    await expect(page.locator("text=Recipes").first()).toBeVisible()
  })

  test("Price step — loads BOM page", async ({ page }) => {
    const id = await getTestEventId()
    await page.goto(`/events/${id}/flow/price`)
    await expect(page).toHaveURL(/\/flow\/price/)
    await expect(page.locator("text=Price").first()).toBeVisible()
  })

  test("Contract step — loads contract page", async ({ page }) => {
    const id = await getTestEventId()
    await page.goto(`/events/${id}/flow/contract`)
    await expect(page).toHaveURL(/\/flow\/contract/)
    await expect(page.locator("body")).toBeVisible()
  })

  test("back-link in flow header returns to event detail", async ({ page }) => {
    const id = await getTestEventId()
    await page.goto(`/events/${id}/flow/recipes`)
    await page.locator(`a[href='/events/${id}']`).first().click()
    await expect(page).toHaveURL(`/events/${id}`)
  })

  test("can navigate between all steps via direct URL", async ({ page }) => {
    const id = await getTestEventId()
    const steps = ["setup", "recipes", "price", "contract"]
    for (const step of steps) {
      await page.goto(`/events/${id}/flow/${step}`)
      await expect(page).toHaveURL(new RegExp(`/flow/${step}`))
    }
  })
})
