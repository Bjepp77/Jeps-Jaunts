import { createBrowserClient } from "@supabase/ssr"

// Use createBrowserClient (from @supabase/ssr) so that:
// 1. Auth uses PKCE flow — magic links redirect with ?code= not a hash fragment
// 2. Session is stored in cookies, keeping client and server state in sync
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
