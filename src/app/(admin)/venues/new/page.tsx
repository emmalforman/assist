"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewVenuePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());

    await fetch("/api/venues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    router.push("/venues");
    router.refresh();
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Add Venue</h1>
        <p className="text-sm text-muted mt-1">Add a new space to host events.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card-bg border border-border rounded-xl p-6 max-w-2xl space-y-5">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Venue Name *</label>
          <input name="name" required className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" placeholder="e.g. Biondivino" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">City</label>
            <input name="city" className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Capacity</label>
            <input name="capacity" type="number" className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Address</label>
          <input name="address" className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Contact Name</label>
            <input name="contactName" className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Contact Email</label>
            <input name="contactEmail" type="email" className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Contact Phone</label>
            <input name="contactPhone" className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Notes</label>
          <textarea name="notes" rows={3} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="bg-accent text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-accent-light transition-colors disabled:opacity-50">
            {saving ? "Saving..." : "Add Venue"}
          </button>
          <button type="button" onClick={() => router.back()} className="text-sm text-muted px-5 py-2.5 rounded-lg border border-border hover:bg-zinc-50 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </>
  );
}
