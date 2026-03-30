import Link from "next/link"

// Fallback for any /auth/* path that isn't /auth/callback.
// The real auth exchange is handled by the Route Handler at /auth/callback/route.ts
export default function AuthFallbackPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-gray-600 mb-4">Something went wrong with the login link.</p>
        <Link
          href="/login"
          className="text-sm text-green-600 hover:underline"
        >
          Back to login
        </Link>
      </div>
    </main>
  )
}
