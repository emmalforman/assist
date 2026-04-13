import { prisma } from "@/lib/db";

const statusColors: Record<string, string> = {
  complete: "bg-emerald-100 text-emerald-800",
  inviting: "bg-blue-100 text-blue-800",
  planning: "bg-amber-100 text-amber-800",
  not_started: "bg-zinc-100 text-zinc-600",
  did_not_do: "bg-red-100 text-red-700",
};

function formatDate(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function Dashboard() {
  const [totalEvents, completeEvents, upcomingEvents, totalContacts, totalSponsors, totalVenues, recentEvents] =
    await Promise.all([
      prisma.event.count(),
      prisma.event.count({ where: { status: "complete" } }),
      prisma.event.count({ where: { date: { gte: new Date() } } }),
      prisma.contact.count(),
      prisma.sponsor.count(),
      prisma.venue.count(),
      prisma.event.findMany({
        orderBy: { date: "desc" },
        take: 8,
        include: { venue: true, sponsors: { include: { sponsor: true } } },
      }),
    ]);

  const stats = [
    { label: "Total Events", value: totalEvents, color: "text-accent" },
    { label: "Completed", value: completeEvents, color: "text-emerald-600" },
    { label: "Upcoming", value: upcomingEvents, color: "text-blue-600" },
    { label: "Contacts", value: totalContacts, color: "text-violet-600" },
    { label: "Sponsors", value: totalSponsors, color: "text-amber-600" },
    { label: "Venues", value: totalVenues, color: "text-pink-600" },
  ];

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-muted mt-1">Your event growth engine at a glance.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card-bg border border-border rounded-xl p-4">
            <p className="text-xs text-muted font-medium uppercase tracking-wide">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent events */}
      <div className="bg-card-bg border border-border rounded-xl">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-zinc-900">Recent Events</h2>
        </div>
        <div className="divide-y divide-border">
          {recentEvents.map((event) => (
            <div key={event.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    statusColors[event.status] || "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {event.status.replace(/_/g, " ")}
                </span>
                <div>
                  <p className="text-sm font-medium text-zinc-900">{event.name}</p>
                  <p className="text-xs text-muted">
                    {event.venue?.name || "No venue"} · {event.audience.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-zinc-700">{formatDate(event.date)}</p>
                {event.sponsors.length > 0 && (
                  <p className="text-xs text-muted">
                    {event.sponsors.map((s) => s.sponsor.name).join(", ")}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
