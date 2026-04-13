import { prisma } from "@/lib/db";
import Link from "next/link";

const sourceColors: Record<string, string> = {
  linkedin: "bg-blue-100 text-blue-700",
  gmail: "bg-red-100 text-red-700",
  referral: "bg-emerald-100 text-emerald-700",
  manual: "bg-zinc-100 text-zinc-600",
};

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? "text-emerald-600 bg-emerald-50" :
    score >= 60 ? "text-amber-600 bg-amber-50" :
    "text-zinc-500 bg-zinc-50";
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>
      {score}
    </span>
  );
}

export default async function ContactsPage() {
  const contacts = await prisma.contact.findMany({
    orderBy: { leadScore: "desc" },
    include: {
      _count: { select: { eventGuests: true } },
    },
  });

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Contacts</h1>
          <p className="text-sm text-muted mt-1">
            {contacts.length} contacts in your network
          </p>
        </div>
        <Link
          href="/contacts/new"
          className="bg-accent text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-accent-light transition-colors"
        >
          + Add Contact
        </Link>
      </div>

      <div className="bg-card-bg border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-zinc-50/50">
              <th className="text-left text-xs font-semibold text-muted uppercase tracking-wide px-6 py-3">Name</th>
              <th className="text-left text-xs font-semibold text-muted uppercase tracking-wide px-6 py-3">Company</th>
              <th className="text-left text-xs font-semibold text-muted uppercase tracking-wide px-6 py-3">Role</th>
              <th className="text-left text-xs font-semibold text-muted uppercase tracking-wide px-6 py-3">Source</th>
              <th className="text-left text-xs font-semibold text-muted uppercase tracking-wide px-6 py-3">Score</th>
              <th className="text-left text-xs font-semibold text-muted uppercase tracking-wide px-6 py-3">Events</th>
              <th className="text-left text-xs font-semibold text-muted uppercase tracking-wide px-6 py-3">Tags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {contacts.map((contact) => (
              <tr key={contact.id} className="hover:bg-zinc-50/50 transition-colors">
                <td className="px-6 py-3">
                  <p className="text-sm font-medium text-zinc-900">
                    {contact.firstName} {contact.lastName}
                  </p>
                  <p className="text-xs text-muted">{contact.email}</p>
                </td>
                <td className="px-6 py-3 text-sm text-zinc-700">{contact.company || "—"}</td>
                <td className="px-6 py-3 text-sm text-zinc-700">{contact.role || "—"}</td>
                <td className="px-6 py-3">
                  {contact.source && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sourceColors[contact.source] || "bg-zinc-100 text-zinc-600"}`}>
                      {contact.source}
                    </span>
                  )}
                </td>
                <td className="px-6 py-3">
                  <ScoreBadge score={contact.leadScore} />
                </td>
                <td className="px-6 py-3 text-sm text-zinc-700">{contact._count.eventGuests}</td>
                <td className="px-6 py-3">
                  <div className="flex flex-wrap gap-1">
                    {contact.tags?.split(",").map((tag) => (
                      <span key={tag} className="text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
