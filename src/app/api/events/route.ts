import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Auto-fill city from venue if not explicitly provided
  let city: string | null = body.city || null;
  if (!city && body.venueId) {
    const venue = await prisma.venue.findUnique({ where: { id: body.venueId } });
    city = venue?.city || null;
  }

  const event = await prisma.event.create({
    data: {
      name: body.name,
      status: body.status || "not_started",
      audience: body.audience || "all_members",
      city,
      date: body.date ? new Date(body.date) : null,
      venueId: body.venueId || null,
      lumaUrl: body.lumaUrl || null,
      nextSteps: body.nextSteps || null,
    },
  });

  return NextResponse.json(event, { status: 201 });
}
