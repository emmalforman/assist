"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DefaultValues = {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  rsvpStatus: string | null;
};

export function RsvpForm({
  eventId,
  defaultValues,
}: {
  eventId: string;
  defaultValues?: DefaultValues;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(defaultValues?.rsvpStatus === "confirmed");
  const [error, setError] = useState<string | null>(null);

  async function submit(status: "confirmed" | "declined") {
    setSaving(true);
    setError(null);
    const form = document.getElementById("rsvp-form") as HTMLFormElement;
    const formData = new FormData(form);

    const res = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        email: formData.get("email"),
        company: formData.get("company"),
        status,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      setSaving(false);
      return;
    }

    setSaved(status === "confirmed");
    // Persist member identity for /my page and re-renders
    if (typeof window !== "undefined" && data.email) {
      localStorage.setItem("myca.email", data.email);
    }
    // Refresh to update the guest list + pre-fill
    router.replace(`/e/${eventId}?email=${encodeURIComponent(String(formData.get("email") || ""))}`);
    router.refresh();
    setSaving(false);
  }

  return (
    <form id="rsvp-form" className="space-y-3" onSubmit={(e) => e.preventDefault()}>
      <div className="grid grid-cols-2 gap-3">
        <input
          name="firstName"
          required
          defaultValue={defaultValues?.firstName}
          placeholder="First name"
          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
        <input
          name="lastName"
          defaultValue={defaultValues?.lastName}
          placeholder="Last name"
          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
      </div>
      <input
        name="email"
        type="email"
        required
        defaultValue={defaultValues?.email}
        placeholder="you@example.com"
        className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
      />
      <input
        name="company"
        defaultValue={defaultValues?.company}
        placeholder="Company (optional)"
        className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
      />

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <button
          type="button"
          onClick={() => submit("confirmed")}
          disabled={saving}
          className="flex-1 bg-accent text-white text-sm font-semibold py-3 rounded-lg hover:bg-accent-light transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : saved ? "✓ You're going — save again" : "I'm going"}
        </button>
        <button
          type="button"
          onClick={() => submit("declined")}
          disabled={saving}
          className="text-sm text-muted border border-border px-5 py-3 rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50"
        >
          Can&apos;t make it
        </button>
      </div>

      {saved && (
        <p className="text-xs text-emerald-600 pt-1">
          Saved. See all your upcoming events at{" "}
          <a
            href={`/my?email=${encodeURIComponent(defaultValues?.email || "")}`}
            className="underline font-medium"
          >
            /my
          </a>
          .
        </p>
      )}
    </form>
  );
}
