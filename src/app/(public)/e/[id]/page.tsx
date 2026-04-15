import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { RsvpForm } from "./rsvp-form";
import Link from "next/link";

function formatFullDate(d: Date | null) {
  if (!d) return "Date TBD";
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function PublicEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ email?: string }>;
}) {
  const { id } = await params;
  const { email } = await searchParams;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      venue: true,
      guests: {
        where: { rsvpStatus: "confirmed" },
        include: { contact: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!event) notFound();

  // Pre-fill the form if the member has been here before (email in URL)
  let currentGuest = null;
  if (email) {
    const contact = await prisma.contact.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        eventGuests: { where: { eventId: id } },
      },
    });
    if (contact) {
      currentGuest = {
        firstName: contact.firstName,
        lastName: contact.lastName || "",
        email: contact.email || "",
        company: contact.company || "",
        rsvpStatus: contact.eventGuests[0]?.rsvpStatus || null,
      };
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/" className="text-xs text-muted hover:text-accent">
          ← Myca
        </Link>
      </div>

      {/* Event header */}
      <div className="bg-card-bg border border-border rounded-2xl p-8 mb-6">
        <div className="flex items-center gap-2 mb-3">
          {event.city && (
            <span className="text-xs font-medium bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full">
              {event.city}
            </span>
          )}
          <span className="text-xs font-medium bg-accent/10 text-accent px-2.5 py-1 rounded-full capitalize">
            {event.audience.replace(/_/g, " ")}
          </span>
        </div>

        <h1 className="text-3xl font-bold text-zinc-900 mb-3">{event.name}</h1>

        <div className="space-y-2 text-zinc-700 mb-6">
          <p className="text-lg">{formatFullDate(event.date)}</p>
          {event.venue && (
            <p className="text-sm text-muted">
              @ {event.venue.name}
              {event.venue.address && ` — ${event.venue.address}`}
            </p>
          )}
        </div>

        {event.nextSteps && (
          <p className="text-sm text-zinc-600 whitespace-pre-wrap leading-relaxed">
            {event.nextSteps.split("\n").filter((l) => !l.startsWith("Imported from") && !l.startsWith("Source:") && !l.startsWith("Link:")).join("\n").trim()}
          </p>
        )}

        {event.date && (
          <a
            href={`/api/events/${event.id}/ics`}
            className="inline-flex items-center gap-2 mt-4 text-sm bg-zinc-100 text-zinc-700 font-medium px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            Add to Calendar
          </a>
        )}
      </div>

      {/* RSVP form */}
      <div className="bg-card-bg border border-border rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-1">
          {currentGuest?.rsvpStatus === "confirmed"
            ? "You're in 🎉"
            : currentGuest?.rsvpStatus === "saved"
            ? "Saved for later ★"
            : currentGuest?.rsvpStatus === "declined"
            ? "Not this time"
            : "Interested?"}
        </h2>
        <p className="text-sm text-muted mb-4">
          {currentGuest?.rsvpStatus === "confirmed"
            ? "We'll see you there. Update your status below if anything changes."
            : currentGuest?.rsvpStatus === "saved"
            ? "This is on your personal list. Mark yourself as going when you're ready."
            : "Save it for later or commit right now — your call."}
        </p>
        <RsvpForm
          eventId={event.id}
          defaultValues={currentGuest || undefined}
        />
      </div>

      {/* Who's going */}
      <div className="bg-card-bg border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">
          Who&apos;s going ({event.guests.length})
        </h2>
        {event.guests.length === 0 ? (
          <p className="text-sm text-muted">Be the first to RSVP.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {event.guests.map((g) => (
              <div key={g.id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-violet-500 text-white flex items-center justify-center text-sm font-semibold">
                  {g.contact.firstName.charAt(0)}
                  {g.contact.lastName?.charAt(0) || ""}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">
                    {g.contact.firstName} {g.contact.lastName?.charAt(0) || ""}.
                  </p>
                  {g.contact.company && (
                    <p className="text-xs text-muted truncate">{g.contact.company}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
