"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SyncButton() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSync() {
    setSyncing(true);
    setResult(null);
    const res = await fetch("/api/sync", { method: "POST" });
    const data = await res.json();
    const summary = data.synced
      ?.map((s: { feed: string; created?: number; updated?: number; error?: string }) =>
        s.error ? `${s.feed}: error` : `${s.feed}: +${s.created} new, ${s.updated} updated`
      )
      .join(" · ");
    setResult(summary || "No feeds to sync");
    router.refresh();
    setSyncing(false);
    setTimeout(() => setResult(null), 5000);
  }

  return (
    <div className="flex items-center gap-3">
      {result && <span className="text-xs text-emerald-600">{result}</span>}
      <button
        onClick={handleSync}
        disabled={syncing}
        className="bg-accent text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-accent-light transition-colors disabled:opacity-50"
      >
        {syncing ? "Syncing all..." : "Sync All Feeds"}
      </button>
    </div>
  );
}
