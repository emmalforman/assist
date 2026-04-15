"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bulkAssignGuests, updateRsvp, checkInGuest } from "@/lib/actions";

type Guest = {
  id: string;
  contactId: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  company: string | null;
  rsvpStatus: string;
  attended: boolean;
};

type AvailableContact = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  company: string | null;
  leadScore: number;
  tags: string | null;
};

export function GuestManager({
  eventId,
  guests,
  availableContacts,
  rsvpColors,
}: {
  eventId: string;
  guests: Guest[];
  availableContacts: AvailableContact[];
  rsvpColors: Record<string, string>;
}) {
  const router = useRouter();
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);

  const filtered = availableContacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.firstName.toLowerCase().includes(q) ||
      (c.lastName?.toLowerCase() || "").includes(q) ||
      (c.email?.toLowerCase() || "").includes(q) ||
      (c.company?.toLowerCase() || "").includes(q) ||
      (c.tags?.toLowerCase() || "").includes(q)
    );
  });

  function toggleContact(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(filtered.map((c) => c.id)));
  }

  async function handleBulkAdd() {
    setAdding(true);
    await bulkAssignGuests(eventId, Array.from(selectedIds));
    setSelectedIds(new Set());
    setShowAddPanel(false);
    router.refresh();
    setAdding(false);
  }

  async function handleRsvpChange(guestId: string, status: string) {
    await updateRsvp(guestId, status);
    router.refresh();
  }

  async function handleCheckIn(guestId: string) {
    await checkInGuest(guestId);
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-zinc-900">Guest List ({guests.length})</h2>
        <button
          onClick={() => setShowAddPanel(!showAddPanel)}
          className="text-xs bg-accent text-white font-medium px-3 py-1.5 rounded-lg hover:bg-accent-light transition-colors"
        >
          {showAddPanel ? "Close" : "+ Add Guests"}
        </button>
      </div>

      {/* Bulk add panel */}
      {showAddPanel && (
        <div className="bg-card-bg border border-accent/20 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-accent">
              Select contacts to invite ({selectedIds.size} selected)
            </p>
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-xs text-accent hover:underline">
                Select all ({filtered.length})
              </button>
              {selectedIds.size > 0 && (
                <button
                  onClick={handleBulkAdd}
                  disabled={adding}
                  className="text-xs bg-accent text-white font-medium px-3 py-1 rounded-lg disabled:opacity-50"
                >
                  {adding ? "Adding..." : `Add ${selectedIds.size} guests`}
                </button>
              )}
            </div>
          </div>
          <input
            type="text"
            placeholder="Search contacts by name, email, company, or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          <div className="max-h-64 overflow-y-auto divide-y divide-border">
            {filtered.slice(0, 50).map((c) => (
              <label
                key={c.id}
                className={`flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-zinc-50 transition-colors ${
                  selectedIds.has(c.id) ? "bg-accent/5" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(c.id)}
                  onChange={() => toggleContact(c.id)}
                  className="rounded border-border text-accent focus:ring-accent/50"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-zinc-900 truncate">
                    {c.firstName} {c.lastName} {c.company && `· ${c.company}`}
                  </p>
                  <p className="text-xs text-muted truncate">{c.email}</p>
                </div>
                <span className="text-xs font-bold text-accent/60">{c.leadScore}</span>
                {c.tags && (
                  <div className="hidden md:flex gap-1">
                    {c.tags.split(",").slice(0, 2).map((t) => (
                      <span key={t} className="text-xs bg-zinc-100 text-zinc-500 px-1 rounded">{t.trim()}</span>
                    ))}
                  </div>
                )}
              </label>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-muted py-4 text-center">No contacts match your search.</p>
            )}
          </div>
        </div>
      )}

      {/* Guest table */}
      <div className="bg-card-bg border border-border rounded-xl overflow-hidden">
        {guests.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted">No guests yet. Add contacts to get started.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-zinc-50/50">
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wide px-4 py-2.5">Name</th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wide px-4 py-2.5">Email</th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wide px-4 py-2.5">RSVP</th>
                <th className="text-left text-xs font-semibold text-muted uppercase tracking-wide px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {guests.map((g) => (
                <tr key={g.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-4 py-2.5">
                    <p className="text-sm font-medium text-zinc-900">{g.firstName} {g.lastName}</p>
                    {g.company && <p className="text-xs text-muted">{g.company}</p>}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted">{g.email || "—"}</td>
                  <td className="px-4 py-2.5">
                    <select
                      value={g.rsvpStatus}
                      onChange={(e) => handleRsvpChange(g.id, e.target.value)}
                      className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${rsvpColors[g.rsvpStatus] || "bg-zinc-100"}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="invited">Invited</option>
                      <option value="saved">★ Saved</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="declined">Declined</option>
                      <option value="waitlisted">Waitlisted</option>
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    {!g.attended ? (
                      <button
                        onClick={() => handleCheckIn(g.id)}
                        className="text-xs text-accent hover:underline"
                      >
                        Check in
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-600 font-medium">Checked in</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
