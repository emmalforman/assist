import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { SendMessages } from "./send-messages";

const statusColors: Record<string, string> = {
  pending: "bg-zinc-100 text-zinc-600",
  sent: "bg-emerald-100 text-emerald-700",
  opened: "bg-blue-100 text-blue-700",
  replied: "bg-violet-100 text-violet-700",
  bounced: "bg-red-100 text-red-700",
};

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const campaign = await prisma.outreachCampaign.findUnique({
    where: { id },
    include: {
      event: { select: { name: true, date: true } },
      templates: { orderBy: { stepOrder: "asc" } },
      messages: {
        include: { contact: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!campaign) notFound();

  const pendingCount = campaign.messages.filter((m) => m.status === "pending").length;
  const sentCount = campaign.messages.filter((m) => m.status === "sent").length;

  return (
    <>
      <div className="mb-8">
        <p className="text-xs text-muted mb-1">Campaign for: {campaign.event.name}</p>
        <h1 className="text-2xl font-bold text-zinc-900">{campaign.name}</h1>
        <div className="flex items-center gap-3 mt-2">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            campaign.status === "active" ? "bg-emerald-100 text-emerald-700" :
            campaign.status === "draft" ? "bg-zinc-100 text-zinc-600" :
            "bg-blue-100 text-blue-700"
          }`}>{campaign.status}</span>
          <span className="text-xs text-muted">{campaign.type}</span>
          <span className="text-xs text-muted">{pendingCount} pending · {sentCount} sent</span>
        </div>
      </div>

      {/* Templates */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-zinc-900 mb-3">Email Templates</h2>
        <div className="space-y-3">
          {campaign.templates.map((t) => (
            <div key={t.id} className="bg-card-bg border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs bg-accent/10 text-accent font-medium px-2 py-0.5 rounded-full">
                  Step {t.stepOrder}
                </span>
                {t.delayDays > 0 && (
                  <span className="text-xs text-muted">+{t.delayDays} days after previous</span>
                )}
              </div>
              <p className="text-sm font-medium text-zinc-900 mb-1">{t.subject}</p>
              <pre className="text-xs text-zinc-600 whitespace-pre-wrap font-sans leading-relaxed">{t.body}</pre>
            </div>
          ))}
        </div>
      </div>

      {/* Messages with send control */}
      <SendMessages
        campaignId={campaign.id}
        messages={campaign.messages.map((m) => ({
          id: m.id,
          to: m.contact.email || "",
          toName: `${m.contact.firstName} ${m.contact.lastName || ""}`.trim(),
          subject: m.subject || "",
          body: m.body || "",
          status: m.status,
          sentAt: m.sentAt?.toISOString() || null,
        }))}
        statusColors={statusColors}
      />
    </>
  );
}
