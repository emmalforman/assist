"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Feed = {
  id: string;
  name: string;
  url: string;
  platform: string;
  enabled: boolean;
  lastSyncAt: string | null;
  lastError: string | null;
  eventCount: number;
};

const platformColors: Record<string, string> = {
  luma: "bg-violet-100 text-violet-700",
  partiful: "bg-pink-100 text-pink-700",
  gcal: "bg-blue-100 text-blue-700",
  outlook: "bg-cyan-100 text-cyan-700",
  ical: "bg-zinc-100 text-zinc-600",
};

export function FeedList({ feeds }: { feeds: Feed[] }) {
  const router = useRouter();
  const [syncing, setSyncing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function syncOne(feedId: string) {
    setSyncing(feedId);
    await fetch(`/api/sync?feedId=${feedId}`, { method: "POST" });
    router.refresh();
    setSyncing(null);
  }

  async function deleteFeed(feedId: string) {
    setDeleting(feedId);
    await fetch(`/api/feeds?id=${feedId}`, { method: "DELETE" });
    router.refresh();
    setDeleting(null);
  }

  async function toggleFeed(feedId: string, enabled: boolean) {
    await fetch("/api/feeds", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: feedId, enabled }),
    });
    router.refresh();
  }

  if (feeds.length === 0) {
    return (
      <div className="bg-card-bg border border-border rounded-xl p-8 text-center">
        <p className="text-sm text-muted">No feeds yet. Add your first calendar feed above.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-zinc-900 mb-3">Calendar Feeds ({feeds.length})</h2>
      <div className="space-y-3">
        {feeds.map((feed) => (
          <div key={feed.id} className="bg-card-bg border border-border rounded-xl p-5">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-zinc-900">{feed.name}</h3>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${platformColors[feed.platform] || platformColors.ical}`}>
                  {feed.platform}
                </span>
                {!feed.enabled && (
                  <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">disabled</span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => syncOne(feed.id)}
                  disabled={syncing === feed.id}
                  className="text-xs bg-accent/10 text-accent font-medium px-3 py-1.5 rounded-lg hover:bg-accent/20 disabled:opacity-50"
                >
                  {syncing === feed.id ? "Syncing..." : "Sync Now"}
                </button>
                <button
                  onClick={() => toggleFeed(feed.id, !feed.enabled)}
                  className="text-xs border border-border text-muted px-3 py-1.5 rounded-lg hover:bg-zinc-50"
                >
                  {feed.enabled ? "Disable" : "Enable"}
                </button>
                <button
                  onClick={() => deleteFeed(feed.id)}
                  disabled={deleting === feed.id}
                  className="text-xs text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50"
                >
                  {deleting === feed.id ? "..." : "Remove"}
                </button>
              </div>
            </div>

            <p className="text-xs text-muted font-mono truncate mb-2">{feed.url}</p>

            <div className="flex gap-4 text-xs text-muted">
              <span>{feed.eventCount} events in feed</span>
              {feed.lastSyncAt && (
                <span>Last sync: {new Date(feed.lastSyncAt).toLocaleString()}</span>
              )}
              {!feed.lastSyncAt && <span>Never synced</span>}
            </div>

            {feed.lastError && (
              <p className="text-xs text-red-600 mt-2 bg-red-50 rounded px-2 py-1">
                Error: {feed.lastError}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
