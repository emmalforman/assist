"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Venue = { id: string; name: string };

export function NewEventForm({ venues }: { venues: Venue[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());

    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    router.push("/events");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card-bg border border-border rounded-xl p-6 max-w-2xl space-y-5">
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">Event Name *</label>
        <input name="name" required className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" placeholder="e.g. Women in Robotics Dinner" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Audience</label>
          <select name="audience" className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50">
            <option value="all_members">All Members</option>
            <option value="invite_only">Invite Only</option>
            <option value="external">External</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Status</label>
          <select name="status" className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50">
            <option value="not_started">Not Started</option>
            <option value="planning">Planning</option>
            <option value="inviting">Inviting</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Date</label>
          <input name="date" type="date" className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Venue</label>
          <select name="venueId" className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50">
            <option value="">Select venue...</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">Luma URL</label>
        <input name="lumaUrl" type="url" className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" placeholder="https://lu.ma/..." />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">Next Steps / Notes</label>
        <textarea name="nextSteps" rows={3} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" placeholder="Any planning notes..." />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-accent text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-accent-light transition-colors disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create Event"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-muted px-5 py-2.5 rounded-lg border border-border hover:bg-zinc-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
