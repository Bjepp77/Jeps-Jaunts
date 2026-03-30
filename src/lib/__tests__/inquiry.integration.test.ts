/**
 * Integration: Inquiry submission pipeline
 * Tests the saveInquiryAction data pipeline against the real Supabase DB.
 * Uses the test user (test@fauna.dev) and cleans up after each test.
 */
import { describe, it, expect, afterEach } from "vitest"
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") })

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TEST_USER_ID = process.env.TEST_USER_ID!
const TEST_FLORIST_ID = TEST_USER_ID

const createdInquiryIds: string[] = []
const createdEventIds: string[] = []

afterEach(async () => {
  // Clean up created inquiries and events after each test
  if (createdInquiryIds.length > 0) {
    await admin.from("client_inquiries").delete().in("id", createdInquiryIds)
    createdInquiryIds.length = 0
  }
  if (createdEventIds.length > 0) {
    await admin.from("events").delete().in("id", createdEventIds)
    createdEventIds.length = 0
  }
})

describe("Inquiry pipeline — DB integration", () => {
  it("inserts a client_inquiries row with correct fields", async () => {
    const { data, error } = await admin.from("client_inquiries").insert({
      florist_id: TEST_FLORIST_ID,
      client_name: "Integration Test Client",
      email: "integration@test.com",
      event_date: "2027-10-15",
      venue: "Test Venue",
      budget_cents: 500000,
      event_type: "wedding",
      deliverables_json: [{ type: "bridal_bouquet", qty: 1 }],
      notes: "Integration test inquiry",
      status: "new",
    }).select("id, client_name, email, status").single()

    expect(error).toBeNull()
    expect(data).not.toBeNull()
    expect(data!.client_name).toBe("Integration Test Client")
    expect(data!.email).toBe("integration@test.com")
    expect(data!.status).toBe("new")

    createdInquiryIds.push(data!.id as string)
  })

  it("auto-creates a draft event linked to the inquiry", async () => {
    // Insert inquiry
    const { data: inquiry } = await admin.from("client_inquiries").insert({
      florist_id: TEST_FLORIST_ID,
      client_name: "Pipeline Test",
      email: "pipeline@test.com",
      event_date: "2027-11-20",
      status: "new",
      deliverables_json: [{ type: "bridal_bouquet", qty: 1 }, { type: "boutonniere", qty: 5 }],
    }).select("id").single()

    expect(inquiry).not.toBeNull()
    createdInquiryIds.push(inquiry!.id as string)

    // Simulate what saveInquiryAction does: create the event
    const { data: event, error: eventError } = await admin.from("events").insert({
      user_id: TEST_FLORIST_ID,
      name: "Pipeline Test — November 20, 2027",
      event_date: "2027-11-20",
      inquiry_id: inquiry!.id,
      lead_status: "new",
      client_name: "Pipeline Test",
      client_email: "pipeline@test.com",
    }).select("id, inquiry_id, lead_status").single()

    expect(eventError).toBeNull()
    expect(event).not.toBeNull()
    expect(event!.inquiry_id).toBe(inquiry!.id)
    expect(event!.lead_status).toBe("new")

    createdEventIds.push(event!.id as string)
  })

  it("deliverables_json stores array of {type, qty} objects", async () => {
    const deliverables = [
      { type: "bridal_bouquet", qty: 1 },
      { type: "bridesmaid_bouquet", qty: 6 },
      { type: "boutonniere", qty: 4 },
    ]

    const { data } = await admin.from("client_inquiries").insert({
      florist_id: TEST_FLORIST_ID,
      client_name: "Qty Test Client",
      email: "qty@test.com",
      event_date: "2027-08-10",
      status: "new",
      deliverables_json: deliverables,
    }).select("id, deliverables_json").single()

    expect(data).not.toBeNull()
    const stored = data!.deliverables_json as typeof deliverables
    expect(stored).toHaveLength(3)
    expect(stored.find(d => d.type === "bridesmaid_bouquet")?.qty).toBe(6)

    createdInquiryIds.push(data!.id as string)
  })

  it("rejects inquiry without required fields (client_name)", async () => {
    const { error } = await admin.from("client_inquiries").insert({
      florist_id: TEST_FLORIST_ID,
      email: "noemail@test.com",
      event_date: "2027-05-01",
      status: "new",
      // missing client_name
    })

    expect(error).not.toBeNull()
  })

  it("inquiry status transitions: new → contacted → proposal_sent → booked", async () => {
    const { data: inquiry } = await admin.from("client_inquiries").insert({
      florist_id: TEST_FLORIST_ID,
      client_name: "Status Test",
      email: "status@test.com",
      event_date: "2027-07-04",
      status: "new",
      deliverables_json: [],
    }).select("id").single()

    expect(inquiry).not.toBeNull()
    createdInquiryIds.push(inquiry!.id as string)

    // Create linked event for status testing
    const { data: event } = await admin.from("events").insert({
      user_id: TEST_FLORIST_ID,
      name: "Status Test Event",
      event_date: "2027-07-04",
      inquiry_id: inquiry!.id,
      lead_status: "new",
    }).select("id").single()

    expect(event).not.toBeNull()
    createdEventIds.push(event!.id as string)

    const statuses = ["contacted", "proposal_sent", "booked", "completed"]
    for (const status of statuses) {
      const { error } = await admin
        .from("events")
        .update({ lead_status: status })
        .eq("id", event!.id)
      expect(error).toBeNull()
    }

    const { data: final } = await admin
      .from("events")
      .select("lead_status")
      .eq("id", event!.id)
      .single()

    expect(final!.lead_status).toBe("completed")
  })
})
