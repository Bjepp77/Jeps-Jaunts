/**
 * E2E: Public portal — no auth required
 * Tests the client-facing portal page and intake form submission.
 */
import { test, expect } from "@playwright/test"

const PORTAL_URL = "/portal/test-flora"

test.describe("Public portal — /portal/test-flora", () => {
  test("loads the portal page with business name and intake form", async ({ page }) => {
    await page.goto(PORTAL_URL)
    await expect(page.getByRole("heading", { name: /Test Flora Studio/i })).toBeVisible()
    // Intake form fields exist (no htmlFor — use name selectors)
    await expect(page.locator('input[name="client_name"]')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="event_date"]')).toBeVisible()
  })

  test("shows 404 for unknown portal slug", async ({ page }) => {
    const response = await page.goto("/portal/this-slug-does-not-exist-xyz")
    expect(response?.status()).toBe(404)
  })

  test("intake form — required fields enforced by HTML5 validation", async ({ page }) => {
    await page.goto(PORTAL_URL)
    // Try to submit without filling anything — HTML5 required stops submission
    await page.getByRole("button", { name: /Send Inquiry/i }).click()
    // Form stays visible (not submitted)
    await expect(page.locator('input[name="client_name"]')).toBeVisible()
  })

  test("intake form — successful submission shows thank-you message", async ({ page }) => {
    await page.goto(PORTAL_URL)

    await page.locator('input[name="client_name"]').fill("Jane Doe E2E")
    await page.locator('input[name="email"]').fill(`e2e-${Date.now()}@test.com`)
    await page.locator('input[name="event_date"]').fill("2027-09-20")

    // Optional fields
    await page.locator('input[name="venue"]').fill("The Rosewood Garden")
    await page.locator('input[name="budget"]').fill("8000")
    await page.locator('input[name="deliverable_qty_bridal_bouquet"]').fill("1")
    await page.locator('input[name="deliverable_qty_bridesmaid_bouquet"]').fill("5")

    await page.getByRole("button", { name: /Send Inquiry/i }).click()

    // Success state — shows thank-you heading
    await expect(page.getByRole("heading", { name: /Thank you/i })).toBeVisible({ timeout: 15_000 })
  })

  test("vibe filter chips — clicking All chip stays visible", async ({ page }) => {
    await page.goto(PORTAL_URL)
    const allChip = page.getByRole("button", { name: /^all$/i })
    if (await allChip.isVisible()) {
      await allChip.click()
      await expect(allChip).toBeVisible()
    }
  })
})
