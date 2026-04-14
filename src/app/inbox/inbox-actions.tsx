"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { approveInboxItem, rejectInboxItem } from "@/lib/actions";

export function InboxActions({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);
    await approveInboxItem(itemId);
    router.refresh();
    setLoading(false);
  }

  async function handleReject() {
    setLoading(true);
    await rejectInboxItem(itemId);
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleApprove}
        disabled={loading}
        className="text-xs bg-accent text-white font-medium px-3 py-1.5 rounded-lg hover:bg-accent-light transition-colors disabled:opacity-50"
      >
        {loading ? "..." : "Approve"}
      </button>
      <button
        onClick={handleReject}
        disabled={loading}
        className="text-xs border border-border text-muted font-medium px-3 py-1.5 rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}
