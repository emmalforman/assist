import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Event name is required" }, { status: 400 });
  }
  if (!body.date) {
    return NextResponse.json({ error: "Date is required" }, { status: 400 });
  }
  if (!body.venueId) {
    return NextResponse.json({ error: "Venue is required" }, { status: 400 });
  }

  // Combine date + time if time is provided
  let eventDate: Date;
  if (body.time) {
    eventDate = new Date(`${body.date}T${body.time}`);
  } else {
    eventDate = new Date(body.date);
  }

  // Auto-fill city from venue if not explicitly provided
  let city: string | null = body.city || null;
  if (!city && body.venueId) {
    const venue = await prisma.venue.findUnique({ where: { id: body.venueId } });
    city = venue?.city || null;
  }

  if (!city) {
    return NextResponse.json({ error: "City is required" }, { status: 400 });
  }

  const event = await prisma.event.create({
    data: {
      name: body.name.trim(),
      status: body.status || "not_started",
      audience: body.audience || "all_members",
      city,
      date: eventDate,
      venueId: body.venueId,
      lumaUrl: body.lumaUrl || null,
      nextSteps: body.nextSteps || null,
    },
  });

  return NextResponse.json(event, { status: 201 });
}
