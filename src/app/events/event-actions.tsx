"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { advanceEventStatus } from "@/lib/actions";

const statusFlow: Record<string, string> = {
  not_started: "planning",
  planning: "inviting",
  inviting: "complete",
};

export function EventActions({ eventId, currentStatus }: { eventId: string; currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const nextStatus = statusFlow[currentStatus];

  async function handleAdvance(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!nextStatus) return;
    setLoading(true);
    await advanceEventStatus(eventId, nextStatus);
    router.refresh();
    setLoading(false);
  }

  if (!nextStatus) return null;

  return (
    <button
      onClick={handleAdvance}
      disabled={loading}
      className="text-xs bg-accent/10 text-accent font-medium px-3 py-1.5 rounded-lg hover:bg-accent/20 transition-colors disabled:opacity-50"
    >
      {loading ? "..." : `Move to ${nextStatus.replace(/_/g, " ")}`}
    </button>
  );
}
