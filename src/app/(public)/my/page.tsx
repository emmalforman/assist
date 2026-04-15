import { prisma } from "@/lib/db";
import Link from "next/link";
import { EmailLookupForm } from "./email-lookup";

function formatDate(d: Date | null) {
  if (!d) return "TBD";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const rsvpColors: Record<string, string> = {
  pending: "bg-zinc-100 text-zinc-600",
  invited: "bg-blue-100 text-blue-700",
  saved: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-700",
  declined: "bg-red-100 text-red-700",
  waitlisted: "bg-amber-100 text-amber-700",
};

export default async function MyEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  if (!email) {
    return (
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-xs text-muted hover:text-accent">
            ← Myca
          </Link>
        </div>
        <div className="bg-card-bg border border-border rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">My Events</h1>
          <p className="text-sm text-muted mb-6">
            Enter your email to see all the events you&apos;ve RSVP&apos;d to.
          </p>
          <EmailLookupForm />
        </div>
      </div>
    );
  }

  const contact = await prisma.contact.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      eventGuests: {
        include: {
          event: {
            include: { venue: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!contact) {
    return (
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-xs text-muted hover:text-accent">
            ← Myca
          </Link>
        </div>
        <div className="bg-card-bg border border-border rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Nothing here yet</h1>
          <p className="text-sm text-muted mb-6">
            We don&apos;t have any RSVPs for <span className="font-mono">{email}</span>.
          </p>
          <EmailLookupForm defaultEmail={email} />
        </div>
      </div>
    );
  }

  const now = new Date();
  const upcoming = contact.eventGuests.filter(
    (g) =>
      g.event.date &&
      g.event.date >= now &&
      (g.rsvpStatus === "confirmed" || g.rsvpStatus === "invited")
  );
  const saved = contact.eventGuests.filter(
    (g) => g.rsvpStatus === "saved" && (!g.event.date || g.event.date >= now)
  );
  const past = contact.eventGuests.filter(
    (g) => !g.event.date || g.event.date < now
  );

  const renderGroup = (
    title: string,
    groupGuests: typeof contact.eventGuests
  ) =>
    groupGuests.length === 0 ? null : (
      <div className="mb-6">
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
          {title} ({groupGuests.length})
        </h2>
        <div className="bg-card-bg border border-border rounded-xl divide-y divide-border">
          {groupGuests.map((g) => (
            <div
              key={g.id}
              className="px-5 py-3 flex items-center justify-between hover:bg-zinc-50/50 transition-colors"
            >
              <Link
                href={`/e/${g.event.id}?email=${encodeURIComponent(contact.email!)}`}
                className="flex-1 min-w-0"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-zinc-900 truncate">
                    {g.event.name}
                  </p>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      rsvpColors[g.rsvpStatus] || "bg-zinc-100"
                    }`}
                  >
                    {g.rsvpStatus}
                  </span>
                  {g.event.city && (
                    <span className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">
                      {g.event.city}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted">
                  {formatDate(g.event.date)}
                  {g.event.venue && ` · ${g.event.venue.name}`}
                </p>
              </Link>
              {g.event.date && (
                <a
                  href={`/api/events/${g.event.id}/ics`}
                  className="text-xs text-accent hover:underline ml-3 flex-shrink-0"
                >
                  Calendar
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/" className="text-xs text-muted hover:text-accent">
          ← Myca
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 mb-1">
          Hi {contact.firstName} 👋
        </h1>
        <p className="text-sm text-muted">
          {upcoming.length > 0 && <>{upcoming.length} going · </>}
          {saved.length > 0 && <>{saved.length} saved · </>}
          {past.length > 0 && <>{past.length} past</>}
          {upcoming.length === 0 && saved.length === 0 && past.length === 0 && "No events yet"}
        </p>
      </div>

      {renderGroup("Going ✓", upcoming)}
      {renderGroup("Saved ★", saved)}
      {renderGroup("Past", past)}

      {contact.eventGuests.length === 0 && (
        <div className="bg-card-bg border border-border rounded-xl p-8 text-center">
          <p className="text-sm text-muted">No events yet. Browse and RSVP to start building your calendar.</p>
        </div>
      )}
    </div>
  );
}
