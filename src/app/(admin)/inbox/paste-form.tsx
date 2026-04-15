"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Mode = "url" | "email";

// Platforms that block automated page fetching — prompt the user for the
// caption/description so we can still extract date and venue.
const SCRAPE_BLOCKED_HOSTS = ["instagram.com", "tiktok.com", "facebook.com", "twitter.com", "x.com"];

function needsManualCaption(url: string): string | null {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    const matched = SCRAPE_BLOCKED_HOSTS.find((h) => host === h || host.endsWith("." + h));
    return matched || null;
  } catch {
    return null;
  }
}

export function PasteEmailForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("url");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");

  const blockedHost = needsManualCaption(urlInput);

  async function handleUrlSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const url = String(form.get("url") || "").trim();
    const description = String(form.get("description") || "").trim();

    try {
      const res = await fetch("/api/inbox/ingest-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, description: description || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to ingest URL");
      } else {
        (e.target as HTMLFormElement).reset();
        setOpen(false);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/inbox/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: form.get("from"),
        subject: form.get("subject"),
        body: form.get("body"),
      }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Failed to ingest email");
    else {
      (e.target as HTMLFormElement).reset();
      setOpen(false);
      router.refresh();
    }
    setSaving(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm bg-card-bg border border-dashed border-border text-muted font-medium px-4 py-3 rounded-xl w-full hover:border-accent/30 hover:text-accent transition-colors"
      >
        + Paste a URL or email to ingest
      </button>
    );
  }

  return (
    <div className="bg-card-bg border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">Quick Ingest</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted hover:text-zinc-700">
          Close
        </button>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
            mode === "url" ? "bg-accent text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          Paste URL
        </button>
        <button
          type="button"
          onClick={() => setMode("email")}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
            mode === "email" ? "bg-accent text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          Paste Email
        </button>
      </div>

      {mode === "url" ? (
        <form onSubmit={handleUrlSubmit} className="space-y-3">
          <input
            name="url"
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://resy.com/... or lu.ma/... or instagram.com/p/..."
            required
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
          />

          {blockedHost ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 space-y-1">
              <p className="font-semibold">
                {blockedHost.charAt(0).toUpperCase() + blockedHost.slice(1)} blocks automated scraping.
              </p>
              <p>
                Paste the caption or description below so we can pull out the date, venue, and details.
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted">
              Full auto-parse: Resy, Luma, Eventbrite, Partiful, Posh. Other URLs are fetched for OG tags.
              Optionally paste a description below to help extraction.
            </p>
          )}

          <textarea
            name="description"
            rows={blockedHost ? 5 : 3}
            placeholder={
              blockedHost
                ? "Paste the caption here — e.g. 'Join us May 15 at Moonrise Bagel for our Member Meetup...'"
                : "Optional description or event details..."
            }
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
          />

          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="bg-accent text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-accent-light transition-colors disabled:opacity-50"
          >
            {saving ? "Ingesting..." : "Ingest URL"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          <input
            name="from"
            placeholder="From: Sender Name <sender@example.com>"
            required
            className="w-full border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          <input
            name="subject"
            placeholder="Subject (needs 'event' or 'job' to be categorized)"
            required
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          <textarea
            name="body"
            placeholder="Email body..."
            rows={5}
            required
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="bg-accent text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-accent-light transition-colors disabled:opacity-50"
          >
            {saving ? "Ingesting..." : "Ingest Email"}
          </button>
        </form>
      )}
    </div>
  );
}
