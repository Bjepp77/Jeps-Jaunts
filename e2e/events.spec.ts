/**
 * E2E: Events/Leads pipeline — authenticated florist view
 */
import { test, expect } from "@playwright/test"

test.describe("Events pipeline — /events", () => {
  test("shows events list with pipeline summary pills", async ({ page }) => {
    await page.goto("/events")
    await expect(page).toHaveURL(/\/events/)
    await expect(page.locator("text=New").first()).toBeVisible()
  })

  test("can create a new event", async ({ page }) => {
    await page.goto("/events")
    await page.waitForLoadState("networkidle")

    const eventName = `E2E Event ${Date.now()}`
    // Scroll to ensure form is in view
    await page.locator('input[name="name"]').scrollIntoViewIfNeeded()
    await page.locator('input[name="name"]').fill(eventName)
    await page.locator('input[name="event_date"]').fill("2027-11-12")
    await page.getByRole("button", { name: /^create$/i }).click()

    await expect(page).toHaveURL(/\/events\/[a-f0-9-]{36}$/, { timeout: 10_000 })
    await expect(page.getByText(eventName)).toBeVisible()
  })

  test("lead status dropdown changes value", async ({ page }) => {
    await page.goto("/events")
    await page.waitForLoadState("networkidle")
    const statusSelect = page.locator("select").first()
    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption("contacted")
      await expect(statusSelect).toHaveValue("contacted")
      await statusSelect.selectOption("new")
    }
  })

  test("clicking an event link opens event detail", async ({ page }) => {
    await page.goto("/events")
    const firstEventLink = page.locator("a[href^='/events/']").first()
    if (await firstEventLink.isVisible()) {
      await firstEventLink.click()
      await expect(page).toHaveURL(/\/events\/[a-f0-9-]{36}$/)
    }
  })
})
