import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";

const rsvpColors: Record<string, string> = {
  pending: "bg-zinc-100 text-zinc-600",
  invited: "bg-blue-100 text-blue-700",
  saved: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-700",
  declined: "bg-red-100 text-red-700",
  waitlisted: "bg-amber-100 text-amber-700",
};

function formatDate(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      eventGuests: {
        include: { event: { include: { venue: true } } },
        orderBy: { createdAt: "desc" },
      },
      outreachMessages: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!contact) notFound();

  const fields = [
    { label: "Email", value: contact.email, type: "email" },
    { label: "Phone", value: contact.phone, type: "phone" },
    { label: "Company", value: contact.company, type: "text" },
    { label: "Role", value: contact.role, type: "text" },
    { label: "LinkedIn", value: contact.linkedinUrl, type: "url" },
    { label: "Source", value: contact.source, type: "badge" },
    { label: "Lead Score", value: contact.leadScore.toString(), type: "score" },
    { label: "Tags", value: contact.tags, type: "tags" },
    { label: "Notes", value: contact.notes, type: "text" },
  ];

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link href="/contacts" className="text-xs text-muted hover:text-accent mb-2 block">
            ← Back to contacts
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-violet-500 text-white flex items-center justify-center text-lg font-bold">
              {contact.firstName.charAt(0)}{contact.lastName?.charAt(0) || ""}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">
                {contact.firstName} {contact.lastName}
              </h1>
              {(contact.role || contact.company) && (
                <p className="text-sm text-muted">
                  {contact.role}{contact.role && contact.company && " at "}{contact.company}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* All fields */}
        <div className="lg:col-span-2">
          <div className="bg-card-bg border border-border rounded-xl divide-y divide-border">
            {fields.map((field) => (
              <div key={field.label} className="px-5 py-3 flex items-start justify-between">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide w-28 flex-shrink-0 pt-0.5">
                  {field.label}
                </p>
                <div className="flex-1 min-w-0">
                  {field.type === "email" && field.value ? (
                    <a href={`mailto:${field.value}`} className="text-sm text-accent hover:underline">{field.value}</a>
                  ) : field.type === "phone" && field.value ? (
                    <a href={`tel:${field.value}`} className="text-sm text-accent hover:underline">{field.value}</a>
                  ) : field.type === "url" && field.value ? (
                    <a href={field.value} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline truncate block">{field.value}</a>
                  ) : field.type === "badge" && field.value ? (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-zinc-100 text-zinc-600">{field.value}</span>
                  ) : field.type === "score" ? (
                    <span className={`text-sm font-bold ${
                      contact.leadScore >= 80 ? "text-emerald-600" :
                      contact.leadScore >= 60 ? "text-amber-600" :
                      "text-zinc-500"
                    }`}>{contact.leadScore} / 100</span>
                  ) : field.type === "tags" && field.value ? (
                    <div className="flex flex-wrap gap-1">
                      {field.value.split(",").map((tag) => (
                        <span key={tag} className="text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded">{tag.trim()}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-700">{field.value || "—"}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Event history */}
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-zinc-900 mb-3">
              Event History ({contact.eventGuests.length})
            </h2>
            {contact.eventGuests.length === 0 ? (
              <div className="bg-card-bg border border-border rounded-xl p-6 text-center">
                <p className="text-sm text-muted">No events yet.</p>
              </div>
            ) : (
              <div className="bg-card-bg border border-border rounded-xl divide-y divide-border">
                {contact.eventGuests.map((g) => (
                  <Link
                    key={g.id}
                    href={`/events/${g.event.id}`}
                    className="px-5 py-3 flex items-center justify-between hover:bg-zinc-50/50 transition-colors block"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900">{g.event.name}</p>
                      <p className="text-xs text-muted">
                        {formatDate(g.event.date)}
                        {g.event.venue && ` · ${g.event.venue.name}`}
                        {g.event.city && ` · ${g.event.city}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${rsvpColors[g.rsvpStatus] || "bg-zinc-100"}`}>
                        {g.rsvpStatus}
                      </span>
                      {g.attended && (
                        <span className="text-xs text-emerald-600 font-medium">Checked in</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick stats */}
          <div className="bg-card-bg border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">Quick Stats</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Events attended</span>
                <span className="font-medium text-zinc-700">
                  {contact.eventGuests.filter((g) => g.attended).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Events RSVP'd</span>
                <span className="font-medium text-zinc-700">
                  {contact.eventGuests.filter((g) => g.rsvpStatus === "confirmed").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Events saved</span>
                <span className="font-medium text-zinc-700">
                  {contact.eventGuests.filter((g) => g.rsvpStatus === "saved").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Messages sent</span>
                <span className="font-medium text-zinc-700">{contact.outreachMessages.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Added</span>
                <span className="font-medium text-zinc-700">{formatDate(contact.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Outreach history */}
          {contact.outreachMessages.length > 0 && (
            <div className="bg-card-bg border border-border rounded-xl p-4">
              <h3 className="text-sm font-semibold text-zinc-900 mb-3">Recent Messages</h3>
              <div className="space-y-2">
                {contact.outreachMessages.slice(0, 5).map((msg) => (
                  <div key={msg.id} className="text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        msg.status === "sent" ? "bg-emerald-500" :
                        msg.status === "pending" ? "bg-amber-500" :
                        "bg-zinc-300"
                      }`} />
                      <span className="text-zinc-700 truncate">{msg.subject}</span>
                    </div>
                    <p className="text-muted ml-3">
                      {msg.status} · {formatDate(msg.sentAt || msg.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
