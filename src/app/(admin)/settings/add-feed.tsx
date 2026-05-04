"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddFeedForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);

    await fetch("/api/feeds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        url: form.get("url"),
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
        + Add Calendar Feed
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card-bg border border-border rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-zinc-900">Add Calendar Feed</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted hover:text-zinc-700">
          Cancel
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <input
          name="name"
          required
          placeholder="Feed name (e.g. My Luma)"
          className="col-span-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
        <input
          name="url"
          type="url"
          required
          placeholder="https://api.lu.ma/ics/get?entity=user&id=..."
          className="col-span-2 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="bg-accent text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-accent-light transition-colors disabled:opacity-50"
      >
        {saving ? "Adding..." : "Add Feed"}
      </button>
    </form>
  );
}
