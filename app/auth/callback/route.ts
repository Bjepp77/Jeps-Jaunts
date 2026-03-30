import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (code) {
    const next = searchParams.get("next")
    // Only allow relative paths to prevent open-redirect attacks
    const safePath = next && next.startsWith("/") ? next : "/events"
    const response = NextResponse.redirect(`${origin}${safePath}`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      const url = new URL(`${origin}/login`)
      url.searchParams.set("error", error.message)
      return NextResponse.redirect(url)
    }

    return response
  }

  const url = new URL(`${origin}/login`)
  url.searchParams.set("error", "No login code found — please request a new magic link.")
  return NextResponse.redirect(url)
}
