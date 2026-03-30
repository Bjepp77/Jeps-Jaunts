"use client"

import { useState, useTransition } from "react"
import { saveFloristProfile } from "@/src/lib/save-florist-profile-action"

interface Profile {
  slug: string
  business_name: string | null
  bio: string | null
  contact_email: string | null
  contact_phone: string | null
  location: string | null
  is_portal_live: boolean
}

interface Props {
  profile: Profile | null
}

export function FloristPortalSettings({ profile }: Props) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slug, setSlug] = useState(profile?.slug ?? "")

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await saveFloristProfile(formData)
      if (result.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } else {
        setError(result.error ?? "Something went wrong.")
      }
    })
  }

  const previewUrl = slug ? `/portal/${slug.toLowerCase().replace(/[^a-z0-9-]/g, "-")}` : null

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Slug */}
      <div>
        <label className="block text-xs tracking-widest uppercase font-body text-brown-muted mb-1.5">
          Portal URL Slug
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm font-body text-brown-muted shrink-0">fauna.app/portal/</span>
          <input
            name="slug"
            type="text"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="my-studio"
            pattern="[a-zA-Z0-9-]+"
            className="flex-1 border border-hairline rounded-lg px-3 py-2 text-sm font-body text-charcoal bg-bone focus:outline-none focus:ring-2 focus:ring-green-600/40 placeholder:text-brown-muted/50"
          />
        </div>
        {previewUrl && (
          <p className="text-xs font-body text-brown-muted mt-1">
            Preview:{" "}
            <a href={previewUrl} target="_blank" rel="noreferrer" className="text-green-700 hover:underline">
              fauna.app{previewUrl}
            </a>
          </p>
        )}
      </div>

      {/* Business name */}
      <div>
        <label className="block text-xs tracking-widest uppercase font-body text-brown-muted mb-1.5">
          Studio / Business Name
        </label>
        <input
          name="business_name"
          type="text"
          defaultValue={profile?.business_name ?? ""}
          placeholder="Wildflower Studio"
          className="w-full border border-hairline rounded-lg px-3 py-2 text-sm font-body text-charcoal bg-bone focus:outline-none focus:ring-2 focus:ring-green-600/40 placeholder:text-brown-muted/50"
        />
      </div>

      {/* Bio */}
      <div>
        <label className="block text-xs tracking-widest uppercase font-body text-brown-muted mb-1.5">
          Bio
        </label>
        <textarea
          name="bio"
          rows={3}
          defaultValue={profile?.bio ?? ""}
          placeholder="A short description shown on your portal..."
          className="w-full border border-hairline rounded-lg px-3 py-2 text-sm font-body text-charcoal bg-bone focus:outline-none focus:ring-2 focus:ring-green-600/40 placeholder:text-brown-muted/50 resize-none"
        />
      </div>

      {/* Contact */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs tracking-widest uppercase font-body text-brown-muted mb-1.5">
            Contact Email
          </label>
          <input
            name="contact_email"
            type="email"
            defaultValue={profile?.contact_email ?? ""}
            className="w-full border border-hairline rounded-lg px-3 py-2 text-sm font-body text-charcoal bg-bone focus:outline-none focus:ring-2 focus:ring-green-600/40 placeholder:text-brown-muted/50"
          />
        </div>
        <div>
          <label className="block text-xs tracking-widest uppercase font-body text-brown-muted mb-1.5">
            Phone
          </label>
          <input
            name="contact_phone"
            type="tel"
            defaultValue={profile?.contact_phone ?? ""}
            className="w-full border border-hairline rounded-lg px-3 py-2 text-sm font-body text-charcoal bg-bone focus:outline-none focus:ring-2 focus:ring-green-600/40 placeholder:text-brown-muted/50"
          />
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="block text-xs tracking-widest uppercase font-body text-brown-muted mb-1.5">
          Location
        </label>
        <input
          name="location"
          type="text"
          defaultValue={profile?.location ?? ""}
          placeholder="Salt Lake City, UT"
          className="w-full border border-hairline rounded-lg px-3 py-2 text-sm font-body text-charcoal bg-bone focus:outline-none focus:ring-2 focus:ring-green-600/40 placeholder:text-brown-muted/50"
        />
      </div>

      {/* Live toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          name="is_portal_live"
          defaultChecked={profile?.is_portal_live ?? false}
          className="w-4 h-4 rounded border-hairline accent-green-700"
        />
        <span className="text-sm font-body text-charcoal">
          Portal is live — clients can find and submit inquiries
        </span>
      </label>

      {error && <p className="text-sm text-red-600 font-body">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className={`text-sm font-body px-5 py-2 rounded-lg transition ${
          saved
            ? "bg-green-100 text-green-700 border border-green-200"
            : "bg-charcoal text-bone hover:bg-charcoal/80"
        } disabled:opacity-50`}
      >
        {isPending ? "Saving…" : saved ? "Saved" : "Save Portal Settings"}
      </button>
    </form>
  )
}
