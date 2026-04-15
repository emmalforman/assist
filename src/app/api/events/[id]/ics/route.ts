import { prisma } from "@/lib/db";
import { buildIcs } from "@/lib/ics";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: { venue: true },
  });

  if (!event || !event.date) {
    return NextResponse.json({ error: "Event not found or missing date" }, { status: 404 });
  }

  const ics = buildIcs({
    id: event.id,
    name: event.name,
    date: event.date,
    venue: event.venue?.name,
    city: event.city || event.venue?.city || undefined,
    description: event.nextSteps || undefined,
    url: event.lumaUrl || event.planningDoc || undefined,
  });

  // Sanitize filename
  const filename = event.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.ics"`,
    },
  });
}
