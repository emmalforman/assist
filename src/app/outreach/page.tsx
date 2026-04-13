import { prisma } from "@/lib/db";
import Link from "next/link";

const statusColors: Record<string, string> = {
  draft: "bg-zinc-100 text-zinc-600",
  active: "bg-emerald-100 text-emerald-800",
  paused: "bg-amber-100 text-amber-800",
  complete: "bg-blue-100 text-blue-800",
};

export default async function OutreachPage() {
  const campaigns = await prisma.outreachCampaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      event: { select: { name: true } },
      _count: { select: { messages: true, templates: true } },
    },
  });

  const totalMessages = await prisma.outreachMessage.count();
  const sentMessages = await prisma.outreachMessage.count({ where: { status: "sent" } });

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Outreach</h1>
          <p className="text-sm text-muted mt-1">
            Manage your invite campaigns and follow-ups
          </p>
        </div>
        <Link
          href="/outreach/new"
          className="bg-accent text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-accent-light transition-colors"
        >
          + New Campaign
        </Link>
      </div>

      {/* Outreach stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-card-bg border border-border rounded-xl p-4">
          <p className="text-xs text-muted font-medium uppercase tracking-wide">Campaigns</p>
          <p className="text-2xl font-bold mt-1 text-accent">{campaigns.length}</p>
        </div>
        <div className="bg-card-bg border border-border rounded-xl p-4">
          <p className="text-xs text-muted font-medium uppercase tracking-wide">Messages Sent</p>
          <p className="text-2xl font-bold mt-1 text-emerald-600">{sentMessages}</p>
        </div>
        <div className="bg-card-bg border border-border rounded-xl p-4">
          <p className="text-xs text-muted font-medium uppercase tracking-wide">Total Queued</p>
          <p className="text-2xl font-bold mt-1 text-blue-600">{totalMessages}</p>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="bg-card-bg border border-border rounded-xl p-12 text-center">
          <p className="text-muted text-sm">No campaigns yet.</p>
          <p className="text-xs text-muted mt-1">
            Create your first outreach campaign to start inviting guests to events.
          </p>
        </div>
      ) : (
        <div className="bg-card-bg border border-border rounded-xl divide-y divide-border">
          {campaigns.map((campaign) => (
            <a key={campaign.id} href={`/outreach/${campaign.id}`} className="px-6 py-4 flex items-center justify-between hover:bg-zinc-50/50 transition-colors block">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-zinc-900">{campaign.name}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[campaign.status]}`}>
                    {campaign.status}
                  </span>
                </div>
                <p className="text-xs text-muted mt-0.5">
                  Event: {campaign.event.name} · {campaign._count.templates} templates · {campaign._count.messages} messages
                </p>
              </div>
              <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-1 rounded">{campaign.type}</span>
            </a>
          ))}
        </div>
      )}
    </>
  );
}
