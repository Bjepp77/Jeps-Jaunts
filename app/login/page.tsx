"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/src/lib/supabase"

function LoginForm() {
  const [email, setEmail] = useState("")
  const [msg, setMsg] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(30)
  const [canResend, setCanResend] = useState(false)

  const searchParams = useSearchParams()

  useEffect(() => {
    const error = searchParams.get("error")
    if (error) setMsg(error)
  }, [searchParams])

  // Start 30s resend countdown whenever magic link is sent
  useEffect(() => {
    if (!sent) return
    setResendCountdown(30)
    setCanResend(false)
    const interval = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [sent])

  const nextPath = searchParams.get("next") || "/events"

  async function sendMagicLink(emailAddress: string) {
    setLoading(true)
    setMsg("")
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: emailAddress,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      })
      if (error) {
        setMsg(error.message)
        setSent(false)
        return
      }
      setSent(true)
    } catch (err) {
      setMsg("Unexpected error — please try again.")
      console.error("signInWithOtp error:", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await sendMagicLink(email)
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Seasonality Planner</h1>
        <p className="text-sm text-gray-500 mb-8">Sign in to plan your events.</p>


        {sent ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-medium text-green-800 mb-1">Check your email</p>
              <p className="text-sm text-green-700">
                We sent a magic link to{" "}
                <span className="font-medium">{email}</span>. Click it to sign
                in — it expires in 1 hour.
              </p>
            </div>
            <div className="text-center">
              {canResend ? (
                <button
                  onClick={() => sendMagicLink(email)}
                  disabled={loading}
                  className="text-sm text-green-600 hover:underline disabled:opacity-50"
                >
                  {loading ? "Sending…" : "Resend magic link"}
                </button>
              ) : (
                <p className="text-sm text-gray-400">Resend in {resendCountdown}s</p>
              )}
            </div>
            {msg && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                {msg}
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-md transition"
            >
              {loading ? "Sending…" : "Send magic link"}
            </button>
            {msg && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                {msg}
              </p>
            )}
          </form>
        )}
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
