"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { supabase } from "@/src/lib/supabase"

const NAV_LINKS = [
  { href: "/estimator", label: "Estimator" },
  { href: "/settings",  label: "Settings"  },
]

/** Hidden on login and auth callback pages. */
const HIDDEN_PATHS = ["/login", "/auth"]

export function TopNav() {
  const pathname = usePathname()
  const router = useRouter()

  const hidden = HIDDEN_PATHS.some((p) => pathname.startsWith(p))
  if (hidden) return null

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <nav className="bg-bone border-b border-hairline sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between">

        {/* Brand */}
        <Link
          href="/events"
          className="font-display italic text-base text-charcoal hover:text-brown-mid transition"
        >
          Seasonality Planner
        </Link>

        {/* Nav links + sign out */}
        <div className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`text-xs tracking-widest uppercase font-body px-3 py-1.5 rounded transition ${
                  active
                    ? "text-charcoal bg-section"
                    : "text-brown-muted hover:text-charcoal hover:bg-section"
                }`}
              >
                {label}
              </Link>
            )
          })}

          <div className="w-px h-4 bg-hairline mx-2" />

          <button
            onClick={handleSignOut}
            className="text-xs tracking-widest uppercase font-body px-3 py-1.5 rounded text-brown-muted hover:text-charcoal hover:bg-section transition"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
