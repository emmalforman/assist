import { prisma } from "@/lib/db";
import Link from "next/link";

const tierColors: Record<string, string> = {
  gold: "bg-amber-100 text-amber-800 border-amber-200",
  silver: "bg-zinc-100 text-zinc-700 border-zinc-200",
  bronze: "bg-orange-100 text-orange-800 border-orange-200",
  partner: "bg-violet-100 text-violet-800 border-violet-200",
};

export default async function SponsorsPage() {
  const sponsors = await prisma.sponsor.findMany({
    orderBy: { name: "asc" },
    include: {
      events: {
        include: { event: { select: { name: true, date: true, status: true } } },
      },
    },
  });

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Sponsors</h1>
          <p className="text-sm text-muted mt-1">
            {sponsors.length} sponsors and partners
          </p>
        </div>
        <Link
          href="/sponsors/new"
          className="bg-accent text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-accent-light transition-colors"
        >
          + Add Sponsor
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sponsors.map((sponsor) => (
          <div
            key={sponsor.id}
            className="bg-card-bg border border-border rounded-xl p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-base font-semibold text-zinc-900">{sponsor.name}</h3>
              {sponsor.tier && (
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${
                    tierColors[sponsor.tier] || "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {sponsor.tier}
                </span>
              )}
            </div>

            {(sponsor.contactName || sponsor.contactEmail) && (
              <div className="text-xs text-muted mb-3">
                {sponsor.contactName && <span>{sponsor.contactName}</span>}
                {sponsor.contactName && sponsor.contactEmail && <span> · </span>}
                {sponsor.contactEmail && (
                  <a href={`mailto:${sponsor.contactEmail}`} className="text-accent hover:underline">
                    {sponsor.contactEmail}
                  </a>
                )}
              </div>
            )}

            {sponsor.events.length > 0 && (
              <div className="border-t border-border pt-3 mt-3">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                  Events ({sponsor.events.length})
                </p>
                <div className="space-y-1">
                  {sponsor.events.map((es) => (
                    <div key={es.id} className="flex items-center justify-between text-xs">
                      <span className="text-zinc-700">{es.event.name}</span>
                      <span className={`px-1.5 py-0.5 rounded-full font-medium ${
                        es.status === "delivered"
                          ? "bg-emerald-100 text-emerald-700"
                          : es.status === "confirmed"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-zinc-100 text-zinc-600"
                      }`}>
                        {es.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
