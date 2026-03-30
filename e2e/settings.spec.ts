/**
 * E2E: Settings page — all sections
 */
import { test, expect } from "@playwright/test"

test.describe("Settings page — /settings", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings")
    await page.waitForLoadState("networkidle")
  })

  test("pricing settings section renders", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Pricing" })).toBeVisible()
    // Pricing inputs are controlled (no name attr) — use placeholder
    await expect(page.getByPlaceholder("8.75")).toBeVisible()
  })

  test("florist portal section renders with slug field", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Your Public Portal" })).toBeVisible()
    await expect(page.locator("input[name='slug']")).toBeVisible()
  })

  test("gallery manager section renders", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Gallery" })).toBeVisible()
  })

  test("suppliers section renders", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Suppliers" })).toBeVisible()
  })

  test("recipe defaults section renders", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Default Stem Ratios" })).toBeVisible()
  })

  test("writing style section renders", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Writing Style" })).toBeVisible()
  })

  test("saves pricing settings — tax rate and margin", async ({ page }) => {
    const taxInput = page.getByPlaceholder("8.75")
    const marginInput = page.getByPlaceholder("35")

    if (await taxInput.isVisible() && await marginInput.isVisible()) {
      await taxInput.fill("8")
      await marginInput.fill("60")
      await page.locator("button[type='submit']").first().click()
      await expect(page.getByText(/error/i)).not.toBeVisible({ timeout: 5_000 })
    }
  })

  test("portal settings — slug validation rejects bad format", async ({ page }) => {
    const slugInput = page.locator("input[name='slug']")
    if (await slugInput.isVisible()) {
      await slugInput.fill("INVALID SLUG!!!")
      const saveBtn = page.locator("button[type='submit']").nth(1) // portal form is second
      if (await saveBtn.isVisible()) {
        await saveBtn.click()
        await expect(page.getByText(/slug|format|invalid/i).first()).toBeVisible({ timeout: 5_000 })
      }
    }
  })

  test("billing section renders", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Billing" })).toBeVisible()
  })

  test("privacy / data ownership section renders", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Your Data Is Yours" })).toBeVisible()
  })
})
