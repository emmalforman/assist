import { prisma } from "@/lib/db";
import { EVENT_TEMPLATES } from "@/lib/templates";
import { NewEventForm } from "./form";

export default async function NewEventPage() {
  const venues = await prisma.venue.findMany({ orderBy: { name: "asc" } });

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">New Event</h1>
        <p className="text-sm text-muted mt-1">
          Pick a template to auto-fill everything, or start from scratch.
        </p>
      </div>
      <NewEventForm
        venues={venues}
        templates={Object.entries(EVENT_TEMPLATES).map(([key, t]) => ({
          key,
          name: t.name,
          audience: t.audience,
          defaultNotes: t.defaultNotes,
        }))}
      />
    </>
  );
}
