import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function VenuesPage() {
  const venues = await prisma.venue.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { events: true } },
    },
  });

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Venues</h1>
          <p className="text-sm text-muted mt-1">
            {venues.length} spaces in your network
          </p>
        </div>
        <Link
          href="/venues/new"
          className="bg-accent text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-accent-light transition-colors"
        >
          + Add Venue
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {venues.map((venue) => (
          <div
            key={venue.id}
            className="bg-card-bg border border-border rounded-xl p-5 hover:border-accent/30 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">{venue.name}</h3>
                {venue.city && <p className="text-xs text-muted mt-0.5">{venue.city}</p>}
              </div>
              <span className="text-xs bg-accent/10 text-accent font-medium px-2 py-0.5 rounded-full">
                {venue._count.events} events
              </span>
            </div>
            {venue.address && (
              <p className="text-xs text-zinc-600 mt-3">{venue.address}</p>
            )}
            {venue.capacity && (
              <p className="text-xs text-muted mt-1">Capacity: {venue.capacity}</p>
            )}
            <div className="flex gap-3 mt-4 pt-3 border-t border-border">
              {venue.contactName && (
                <p className="text-xs text-muted">
                  Contact: <span className="text-zinc-700">{venue.contactName}</span>
                </p>
              )}
              {venue.contactEmail && (
                <a href={`mailto:${venue.contactEmail}`} className="text-xs text-accent hover:underline">
                  Email
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
