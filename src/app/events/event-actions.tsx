"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const statusFlow: Record<string, string> = {
  not_started: "planning",
  planning: "inviting",
  inviting: "complete",
};

export function EventActions({ eventId, currentStatus }: { eventId: string; currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const nextStatus = statusFlow[currentStatus];

  async function advanceStatus() {
    if (!nextStatus) return;
    setLoading(true);
    await fetch(`/api/events/${eventId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    router.refresh();
    setLoading(false);
  }

  if (!nextStatus) return null;

  return (
    <button
      onClick={advanceStatus}
      disabled={loading}
      className="text-xs bg-accent/10 text-accent font-medium px-3 py-1.5 rounded-lg hover:bg-accent/20 transition-colors disabled:opacity-50"
    >
      {loading ? "..." : `Move to ${nextStatus.replace(/_/g, " ")}`}
    </button>
  );
}
