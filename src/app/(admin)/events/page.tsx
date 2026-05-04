import { prisma } from "@/lib/db";
import Link from "next/link";
import { EventActions } from "./event-actions";

const statusColors: Record<string, string> = {
  complete: "bg-emerald-100 text-emerald-800",
  inviting: "bg-blue-100 text-blue-800",
  planning: "bg-amber-100 text-amber-800",
  not_started: "bg-zinc-100 text-zinc-600",
  did_not_do: "bg-red-100 text-red-700",
};

const audienceLabels: Record<string, string> = {
  all_members: "All Members",
  invite_only: "Invite Only",
  external: "External",
};

function formatDate(d: Date | null) {
  if (!d) return "TBD";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; past?: string }>;
}) {
  const { city: selectedCity, past: showPast } = await searchParams;

  // Build list of all distinct cities (with counts) for the filter bar
  const cityGroups = await prisma.event.groupBy({
    by: ["city"],
    _count: { city: true },
    orderBy: { _count: { city: "desc" } },
  });

  const cities = cityGroups
    .filter((g) => g.city)
    .map((g) => ({ name: g.city as string, count: g._count.city }));

  const totalCount = cityGroups.reduce((sum, g) => sum + g._count.city, 0);

  // Default: only show today + future events. ?past=1 shows everything.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const includePast = showPast === "1";

  const events = await prisma.event.findMany({
    where: {
      ...(selectedCity ? { city: selectedCity } : {}),
      ...(!includePast
        ? { OR: [{ date: { gte: today } }, { date: null }] }
        : {}),
    },
    orderBy: [{ date: "asc" }],
    include: {
      venue: true,
      sponsors: { include: { sponsor: true } },
      _count: { select: { guests: true } },
    },
  });

  // Group by status pipeline
  const pipeline = ["not_started", "planning", "inviting", "complete", "did_not_do"];
  const grouped = pipeline.map((status) => ({
    status,
    events: events.filter((e) => e.status === status),
  }));

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Events</h1>
          <p className="text-sm text-muted mt-1">
            {events.length} {selectedCity ? `events in ${selectedCity}` : "events across your pipeline"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={includePast ? `/events${selectedCity ? `?city=${encodeURIComponent(selectedCity)}` : ""}` : `/events?past=1${selectedCity ? `&city=${encodeURIComponent(selectedCity)}` : ""}`}
            className="text-xs text-muted border border-border px-3 py-2 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            {includePast ? "Hide past" : "Show past"}
          </Link>
          <Link
            href="/events/new"
            className="bg-accent text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-accent-light transition-colors"
          >
            + New Event
          </Link>
        </div>
      </div>

      {/* City filter pills */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        <span className="text-xs text-muted font-medium uppercase tracking-wide mr-1">City:</span>
        <Link
          href="/events"
          className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
            !selectedCity
              ? "bg-accent text-white"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          }`}
        >
          All <span className="opacity-60 ml-1">{totalCount}</span>
        </Link>
        {cities.map((c) => (
          <Link
            key={c.name}
            href={`/events?city=${encodeURIComponent(c.name)}`}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              selectedCity === c.name
                ? "bg-accent text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {c.name} <span className="opacity-60 ml-1">{c.count}</span>
          </Link>
        ))}
      </div>

      {/* Pipeline view */}
      {events.length === 0 ? (
        <div className="bg-card-bg border border-border rounded-xl p-12 text-center">
          <p className="text-sm text-muted">
            {selectedCity ? `No events in ${selectedCity} yet.` : "No events yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ status, events: group }) =>
            group.length === 0 ? null : (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${
                      statusColors[status]
                    }`}
                  >
                    {status.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-muted">{group.length} events</span>
                </div>
                <div className="bg-card-bg border border-border rounded-xl divide-y divide-border">
                  {group.map((event) => (
                    <a key={event.id} href={`/events/${event.id}`} className="px-6 py-4 flex items-center justify-between hover:bg-zinc-50/50 transition-colors block">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-semibold text-zinc-900 truncate">{event.name}</p>
                          <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full">
                            {audienceLabels[event.audience] || event.audience}
                          </span>
                          {event.city && (
                            <span className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">
                              {event.city}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                          <span>{formatDate(event.date)}</span>
                          {event.venue && <span>@ {event.venue.name}</span>}
                          {event.sponsors.length > 0 && (
                            <span>Sponsors: {event.sponsors.map((s) => s.sponsor.name).join(", ")}</span>
                          )}
                          <span>{event._count.guests} guests</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {event.lumaUrl && (
                          <a
                            href={event.lumaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-accent hover:underline"
                          >
                            Luma
                          </a>
                        )}
                        <EventActions eventId={event.id} currentStatus={event.status} />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </>
  );
}
