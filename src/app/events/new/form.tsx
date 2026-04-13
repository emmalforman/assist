"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createEventFromTemplate } from "@/lib/actions";

type Venue = { id: string; name: string };
type Template = { key: string; name: string; audience: string; defaultNotes: string };

export function NewEventForm({ venues, templates }: { venues: Venue[]; templates: Template[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [mode, setMode] = useState<"template" | "custom">("template");

  const activeTemplate = templates.find((t) => t.key === selectedTemplate);

  async function handleTemplateSubmit(formData: FormData) {
    setSaving(true);
    await createEventFromTemplate(formData);
    router.push("/events");
  }

  async function handleCustomSubmit(e: React.FormEvent<HTMLFormElement>) {
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
    <div className="max-w-3xl">
      {/* Mode toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode("template")}
          className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
            mode === "template" ? "bg-accent text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          From Template
        </button>
        <button
          onClick={() => setMode("custom")}
          className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
            mode === "custom" ? "bg-accent text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          Custom Event
        </button>
      </div>

      {mode === "template" ? (
        <div>
          {/* Template picker */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {templates.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setSelectedTemplate(t.key)}
                className={`text-left p-4 rounded-xl border transition-colors ${
                  selectedTemplate === t.key
                    ? "border-accent bg-accent/5 ring-2 ring-accent/20"
                    : "border-border bg-card-bg hover:border-accent/30"
                }`}
              >
                <p className="text-sm font-semibold text-zinc-900">{t.name}</p>
                <p className="text-xs text-muted mt-1 capitalize">{t.audience.replace(/_/g, " ")}</p>
              </button>
            ))}
          </div>

          {selectedTemplate && (
            <form action={handleTemplateSubmit} className="bg-card-bg border border-border rounded-xl p-6 space-y-5">
              <input type="hidden" name="template" value={selectedTemplate} />

              <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 mb-4">
                <p className="text-xs font-medium text-accent">Auto-configured</p>
                <p className="text-xs text-muted mt-0.5">
                  Email templates, reminders, and thank-you messages are pre-built. An outreach campaign will be auto-created.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Event Name</label>
                <input
                  name="name"
                  defaultValue={activeTemplate?.name}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  placeholder="Override template name or leave as-is"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Date *</label>
                  <input name="date" type="date" required className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" />
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

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-accent text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-accent-light transition-colors disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Event + Campaign"}
                </button>
                <button type="button" onClick={() => router.back()} className="text-sm text-muted px-5 py-2.5 rounded-lg border border-border hover:bg-zinc-50 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <form onSubmit={handleCustomSubmit} className="bg-card-bg border border-border rounded-xl p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Event Name *</label>
            <input name="name" required className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" />
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
              <label className="block text-sm font-medium text-zinc-700 mb-1">Date</label>
              <input name="date" type="date" className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" />
            </div>
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
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Notes</label>
            <textarea name="nextSteps" rows={3} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="bg-accent text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-accent-light transition-colors disabled:opacity-50">
              {saving ? "Creating..." : "Create Event"}
            </button>
            <button type="button" onClick={() => router.back()} className="text-sm text-muted px-5 py-2.5 rounded-lg border border-border hover:bg-zinc-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
