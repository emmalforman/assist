import { prisma } from "@/lib/db";
import { FeedList } from "./feed-list";
import { AddFeedForm } from "./add-feed";
import { SyncButton } from "./sync-button";

export default async function SettingsPage() {
  const feeds = await prisma.calendarFeed.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Settings</h1>
          <p className="text-sm text-muted mt-1">Manage calendar feed syncs and integrations.</p>
        </div>
        <SyncButton />
      </div>

      {/* How to find feed URLs */}
      <details className="mb-6 bg-card-bg border border-border rounded-xl">
        <summary className="px-5 py-3 cursor-pointer text-sm font-semibold text-zinc-900">
          Where to find your iCal feed URLs
        </summary>
        <div className="px-5 py-3 border-t border-border text-xs text-zinc-600 space-y-3">
          <div>
            <p className="font-semibold text-zinc-800 mb-1">Google Calendar</p>
            <p>Settings → Settings for my calendars → [your calendar] → Integrate calendar → &ldquo;Secret address in iCal format&rdquo;</p>
          </div>
          <div>
            <p className="font-semibold text-zinc-800 mb-1">Luma</p>
            <p>Profile → Settings → Export → iCal feed URL. Or construct: <span className="font-mono bg-zinc-100 px-1 rounded">https://api.lu.ma/ics/get?entity=user&id=YOUR_USER_ID</span></p>
          </div>
          <div>
            <p className="font-semibold text-zinc-800 mb-1">Partiful</p>
            <p>Check profile settings for a calendar export/subscribe option.</p>
          </div>
          <div>
            <p className="font-semibold text-zinc-800 mb-1">Any platform</p>
            <p>Look for &ldquo;Subscribe&rdquo;, &ldquo;iCal&rdquo;, &ldquo;Export&rdquo;, or &ldquo;.ics feed&rdquo; in the platform&rsquo;s settings. The URL usually ends in <span className="font-mono bg-zinc-100 px-1 rounded">.ics</span> or contains <span className="font-mono bg-zinc-100 px-1 rounded">ical</span>.</p>
          </div>
        </div>
      </details>

      {/* Add feed form */}
      <div className="mb-8">
        <AddFeedForm />
      </div>

      {/* Feed list */}
      <FeedList feeds={feeds.map((f) => ({
        id: f.id,
        name: f.name,
        url: f.url,
        platform: f.platform,
        enabled: f.enabled,
        lastSyncAt: f.lastSyncAt?.toISOString() || null,
        lastError: f.lastError,
        eventCount: f.eventCount,
      }))} />
    </>
  );
}
