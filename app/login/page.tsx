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

  async function handleGoogleSignIn() {
    setLoading(true)
    setMsg("")
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      })
      if (error) {
        setMsg(error.message)
        setLoading(false)
      }
      // On success the browser is redirected to Google — no further code runs here
    } catch (err) {
      setMsg("Unexpected error — please try again.")
      console.error("Google OAuth error:", err)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Fauna</h1>
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
          <div className="space-y-4">
            {/* Google sign-in (primary) */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 disabled:opacity-50 border border-gray-300 text-gray-700 text-sm font-medium py-2.5 rounded-md transition shadow-sm"
            >
              {/* Google "G" logo SVG */}
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.26c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              {loading ? "Redirecting…" : "Continue with Google"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Magic link (fallback) */}
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
            </form>

            {msg && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                {msg}
              </p>
            )}
          </div>
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
