/**
 * Test-only authentication endpoint.
 * Signs in the test user and sets @supabase/ssr session cookies on the response.
 * Disabled in production — returns 404 unless NODE_ENV !== "production".
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not Found", { status: 404 })
  }

  const secret = request.headers.get("x-test-secret")
  if (!secret || secret !== process.env.TEST_AUTH_SECRET) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  // Sign in using the anon client (password auth)
  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await authClient.auth.signInWithPassword({
    email: process.env.TEST_USER_EMAIL!,
    password: process.env.TEST_USER_PASSWORD!,
  })

  if (error || !data.session) {
    return NextResponse.json({ error: error?.message ?? "Sign in failed" }, { status: 500 })
  }

  const response = NextResponse.json({
    success: true,
    userId: data.user.id,
    email: data.user.email,
  })

  // Use @supabase/ssr to set session cookies in the proper chunked format
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return [] },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  })

  return response
}
