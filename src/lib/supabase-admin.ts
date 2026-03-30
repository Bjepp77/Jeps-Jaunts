import { createClient } from "@supabase/supabase-js"

/**
 * Service-role Supabase client — bypasses RLS.
 * Use ONLY in server-side API routes and background jobs.
 * Never import this in client components or expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 */
export function createSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
