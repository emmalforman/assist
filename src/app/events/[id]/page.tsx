import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { EventDetailActions } from "./detail-actions";
import { GuestManager } from "./guest-manager";

const statusColors: Record<string, string> = {
  complete: "bg-emerald-100 text-emerald-800",
  inviting: "bg-blue-100 text-blue-800",
  planning: "bg-amber-100 text-amber-800",
  not_started: "bg-zinc-100 text-zinc-600",
  did_not_do: "bg-red-100 text-red-700",
};

const rsvpColors: Record<string, string> = {
  pending: "bg-zinc-100 text-zinc-600",
  invited: "bg-blue-100 text-blue-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  declined: "bg-red-100 text-red-700",
  waitlisted: "bg-amber-100 text-amber-700",
};

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      venue: true,
      sponsors: { include: { sponsor: true } },
      guests: { include: { contact: true }, orderBy: { createdAt: "desc" } },
      campaigns: {
        include: { _count: { select: { messages: true } } },
        orderBy: { createdAt: "desc" },
      },
      tickets: true,
    },
  });

  if (!event) notFound();

  const allContacts = await prisma.contact.findMany({
    orderBy: { leadScore: "desc" },
    select: { id: true, firstName: true, lastName: true, email: true, company: true, tags: true, leadScore: true },
  });

  const assignedContactIds = new Set(event.guests.map((g) => g.contactId));
  const availableContacts = allContacts.filter((c) => !assignedContactIds.has(c.id));

  const confirmedCount = event.guests.filter((g) => g.rsvpStatus === "confirmed").length;
  const invitedCount = event.guests.filter((g) => g.rsvpStatus === "invited").length;
  const pendingCount = event.guests.filter((g) => g.rsvpStatus === "pending").length;
  const sentMessages = event.campaigns.reduce((sum, c) => sum + c._count.messages, 0);

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-zinc-900">{event.name}</h1>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[event.status]}`}>
              {event.status.replace(/_/g, " ")}
            </span>
            {event.city && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-violet-50 text-violet-700">
                {event.city}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted">
            {event.date && (
              <span>{event.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
            )}
            {event.venue && <span>@ {event.venue.name}</span>}
            <span className="capitalize">{event.audience.replace(/_/g, " ")}</span>
          </div>
        </div>
        <EventDetailActions eventId={event.id} currentStatus={event.status} lumaUrl={event.lumaUrl} />
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <div className="bg-card-bg border border-border rounded-xl p-3">
          <p className="text-xs text-muted">Total Guests</p>
          <p className="text-xl font-bold text-zinc-900">{event.guests.length}</p>
        </div>
        <div className="bg-card-bg border border-border rounded-xl p-3">
          <p className="text-xs text-muted">Confirmed</p>
          <p className="text-xl font-bold text-emerald-600">{confirmedCount}</p>
        </div>
        <div className="bg-card-bg border border-border rounded-xl p-3">
          <p className="text-xs text-muted">Invited</p>
          <p className="text-xl font-bold text-blue-600">{invitedCount}</p>
        </div>
        <div className="bg-card-bg border border-border rounded-xl p-3">
          <p className="text-xs text-muted">Pending</p>
          <p className="text-xl font-bold text-zinc-500">{pendingCount}</p>
        </div>
        <div className="bg-card-bg border border-border rounded-xl p-3">
          <p className="text-xs text-muted">Emails Queued</p>
          <p className="text-xl font-bold text-accent">{sentMessages}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Guest list — main column */}
        <div className="lg:col-span-2">
          <GuestManager
            eventId={event.id}
            guests={event.guests.map((g) => ({
              id: g.id,
              contactId: g.contactId,
              firstName: g.contact.firstName,
              lastName: g.contact.lastName,
              email: g.contact.email,
              company: g.contact.company,
              rsvpStatus: g.rsvpStatus,
              attended: g.attended,
            }))}
            availableContacts={availableContacts.map((c) => ({
              id: c.id,
              firstName: c.firstName,
              lastName: c.lastName,
              email: c.email,
              company: c.company,
              leadScore: c.leadScore,
              tags: c.tags,
            }))}
            rsvpColors={rsvpColors}
          />
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          {/* Sponsors */}
          <div className="bg-card-bg border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">Sponsors</h3>
            {event.sponsors.length === 0 ? (
              <p className="text-xs text-muted">No sponsors yet.</p>
            ) : (
              <div className="space-y-2">
                {event.sponsors.map((es) => (
                  <div key={es.id} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-700">{es.sponsor.name}</span>
                    <span className={`px-1.5 py-0.5 rounded-full ${
                      es.status === "delivered" ? "bg-emerald-100 text-emerald-700" :
                      es.status === "confirmed" ? "bg-blue-100 text-blue-700" :
                      "bg-zinc-100 text-zinc-600"
                    }`}>{es.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Campaigns */}
          <div className="bg-card-bg border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">Outreach Campaigns</h3>
            {event.campaigns.length === 0 ? (
              <p className="text-xs text-muted">No campaigns yet. Create an event from a template to auto-generate one.</p>
            ) : (
              <div className="space-y-2">
                {event.campaigns.map((c) => (
                  <div key={c.id} className="text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-zinc-700">{c.name}</span>
                      <span className={`px-1.5 py-0.5 rounded-full ${
                        c.status === "active" ? "bg-emerald-100 text-emerald-700" :
                        c.status === "draft" ? "bg-zinc-100 text-zinc-600" :
                        "bg-blue-100 text-blue-700"
                      }`}>{c.status}</span>
                    </div>
                    <p className="text-muted mt-0.5">{c._count.messages} messages</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          {event.nextSteps && (
            <div className="bg-card-bg border border-border rounded-xl p-4">
              <h3 className="text-sm font-semibold text-zinc-900 mb-2">Notes</h3>
              <p className="text-xs text-zinc-600 whitespace-pre-wrap">{event.nextSteps}</p>
            </div>
          )}

          {/* Links */}
          <div className="bg-card-bg border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">Links</h3>
            <div className="space-y-1.5 text-xs">
              {event.lumaUrl && (
                <a href={event.lumaUrl} target="_blank" rel="noopener noreferrer" className="block text-accent hover:underline">
                  Luma Event Page
                </a>
              )}
              {event.photosUrl && (
                <a href={event.photosUrl} target="_blank" rel="noopener noreferrer" className="block text-accent hover:underline">
                  Photo Album
                </a>
              )}
              {event.planningDoc && (
                <a href={event.planningDoc} target="_blank" rel="noopener noreferrer" className="block text-accent hover:underline">
                  Planning Doc
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
