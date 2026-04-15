"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { advanceEventStatus } from "@/lib/actions";

const statusFlow: Record<string, string> = {
  not_started: "planning",
  planning: "inviting",
  inviting: "complete",
};

export function EventDetailActions({
  eventId,
  currentStatus,
  lumaUrl,
}: {
  eventId: string;
  currentStatus: string;
  lumaUrl: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const nextStatus = statusFlow[currentStatus];

  async function handleAdvance() {
    if (!nextStatus) return;
    setLoading(true);
    await advanceEventStatus(eventId, nextStatus);
    router.refresh();
    setLoading(false);
  }

  const actionLabel: Record<string, string> = {
    planning: "Start Inviting (auto-sends emails)",
    inviting: "Mark Complete (auto-sends thank yous)",
    complete: "Done",
  };

  async function copyPublicLink() {
    const url = `${window.location.origin}/e/${eventId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const [copied, setCopied] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={copyPublicLink}
        className="text-xs border border-border px-3 py-2 rounded-lg text-muted hover:bg-zinc-50 transition-colors"
      >
        {copied ? "✓ Copied" : "Copy RSVP Link"}
      </button>
      {lumaUrl && (
        <a
          href={lumaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs border border-border px-3 py-2 rounded-lg text-muted hover:bg-zinc-50 transition-colors"
        >
          Open Luma
        </a>
      )}
      {nextStatus && (
        <button
          onClick={handleAdvance}
          disabled={loading}
          className="text-sm bg-accent text-white font-medium px-4 py-2 rounded-lg hover:bg-accent-light transition-colors disabled:opacity-50"
        >
          {loading ? "Processing..." : actionLabel[nextStatus] || `Move to ${nextStatus}`}
        </button>
      )}
    </div>
  );
}
