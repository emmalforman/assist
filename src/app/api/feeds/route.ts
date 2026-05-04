import { prisma } from "@/lib/db";
import { detectPlatform } from "@/lib/ics-feed";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { name, url } = await request.json();

  if (!name?.trim() || !url?.trim()) {
    return NextResponse.json({ error: "Name and URL are required" }, { status: 400 });
  }

  const existing = await prisma.calendarFeed.findUnique({ where: { url } });
  if (existing) {
    return NextResponse.json({ error: "This feed URL already exists" }, { status: 409 });
  }

  const platform = detectPlatform(url);
  const feed = await prisma.calendarFeed.create({
    data: { name: name.trim(), url: url.trim(), platform },
  });

  return NextResponse.json(feed, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const { id, enabled } = await request.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const feed = await prisma.calendarFeed.update({
    where: { id },
    data: { enabled },
  });

  return NextResponse.json(feed);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.syncedEvent.deleteMany({ where: { feedId: id } });
  await prisma.calendarFeed.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}
