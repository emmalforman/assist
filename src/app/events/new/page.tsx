import { prisma } from "@/lib/db";
import { NewEventForm } from "./form";

export default async function NewEventPage() {
  const venues = await prisma.venue.findMany({ orderBy: { name: "asc" } });

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">New Event</h1>
        <p className="text-sm text-muted mt-1">Create a new event for your community.</p>
      </div>
      <NewEventForm venues={venues} />
    </>
  );
}
