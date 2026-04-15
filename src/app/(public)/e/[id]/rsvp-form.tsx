"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type RsvpStatus = "saved" | "confirmed" | "declined";

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
  const [loading, setLoading] = useState<RsvpStatus | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string | null>(
    defaultValues?.rsvpStatus || null
  );
  const [error, setError] = useState<string | null>(null);

  async function submit(status: RsvpStatus) {
    setLoading(status);
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
      setLoading(null);
      return;
    }

    setCurrentStatus(status);
    if (typeof window !== "undefined" && data.email) {
      localStorage.setItem("myca.email", data.email);
    }
    router.replace(`/e/${eventId}?email=${encodeURIComponent(String(formData.get("email") || ""))}`);
    router.refresh();
    setLoading(null);
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

      <div className="grid grid-cols-3 gap-2 pt-2">
        <button
          type="button"
          onClick={() => submit("saved")}
          disabled={loading !== null}
          className={`text-sm font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 ${
            currentStatus === "saved"
              ? "bg-amber-100 text-amber-800 border border-amber-200"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
          }`}
        >
          {loading === "saved" ? "..." : currentStatus === "saved" ? "★ Saved" : "☆ Save"}
        </button>
        <button
          type="button"
          onClick={() => submit("confirmed")}
          disabled={loading !== null}
          className={`text-sm font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 ${
            currentStatus === "confirmed"
              ? "bg-emerald-600 text-white"
              : "bg-accent text-white hover:bg-accent-light"
          }`}
        >
          {loading === "confirmed"
            ? "..."
            : currentStatus === "confirmed"
            ? "✓ You're going"
            : "I'm going"}
        </button>
        <button
          type="button"
          onClick={() => submit("declined")}
          disabled={loading !== null}
          className={`text-sm font-semibold py-3 rounded-lg border transition-colors disabled:opacity-50 ${
            currentStatus === "declined"
              ? "bg-red-50 text-red-700 border-red-200"
              : "text-muted border-border hover:bg-zinc-50"
          }`}
        >
          {loading === "declined" ? "..." : currentStatus === "declined" ? "✓ Declined" : "Can't make it"}
        </button>
      </div>

      <p className="text-xs text-muted pt-1">
        <strong className="text-zinc-700">Save</strong> bookmarks it privately for later.{" "}
        <strong className="text-zinc-700">I&apos;m going</strong> adds you to the public guest list.
      </p>

      {(currentStatus === "saved" || currentStatus === "confirmed") && (
        <p className="text-xs text-emerald-600 pt-1">
          See all your events at{" "}
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
