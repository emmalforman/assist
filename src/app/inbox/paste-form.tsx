"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PasteEmailForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);

    await fetch("/api/inbox/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: form.get("from"),
        subject: form.get("subject"),
        body: form.get("body"),
      }),
    });

    setSaving(false);
    setOpen(false);
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm bg-card-bg border border-dashed border-border text-muted font-medium px-4 py-3 rounded-xl w-full hover:border-accent/30 hover:text-accent transition-colors"
      >
        + Paste an email manually (for testing)
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card-bg border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">Paste Email</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted hover:text-zinc-700">
          Close
        </button>
      </div>
      <input
        name="from"
        placeholder="From: Sender Name <sender@example.com>"
        required
        className="w-full border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50"
      />
      <input
        name="subject"
        placeholder="Subject (must contain 'event' or 'job' to be categorized)"
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
      <button
        type="submit"
        disabled={saving}
        className="bg-accent text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-accent-light transition-colors disabled:opacity-50"
      >
        {saving ? "Ingesting..." : "Ingest Email"}
      </button>
    </form>
  );
}
