import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const venue = await prisma.venue.create({
    data: {
      name: body.name,
      address: body.address || null,
      city: body.city || null,
      capacity: body.capacity ? parseInt(body.capacity, 10) : null,
      contactName: body.contactName || null,
      contactEmail: body.contactEmail || null,
      contactPhone: body.contactPhone || null,
      notes: body.notes || null,
    },
  });

  return NextResponse.json(venue, { status: 201 });
}
