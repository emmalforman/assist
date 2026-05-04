import { prisma } from "@/lib/db";
import { fetchIcsFeed, parseIcsFeed } from "@/lib/ics-feed";
import { NextRequest, NextResponse } from "next/server";

// Sync all enabled calendar feeds.
// Can be called manually (Sync Now button) or by a cron job:
//   Vercel Cron: add to vercel.json { "crons": [{ "path": "/api/sync", "schedule": "0 */2 * * *" }] }
//
// Optionally pass ?feedId=xxx to sync a single feed.

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const feedId = searchParams.get("feedId");

  const feeds = await prisma.calendarFeed.findMany({
    where: feedId ? { id: feedId } : { enabled: true },
  });

  if (feeds.length === 0) {
    return NextResponse.json({ message: "No feeds to sync" });
  }

  const results = [];

  for (const feed of feeds) {
    try {
      const icsText = await fetchIcsFeed(feed.url);
      const events = parseIcsFeed(icsText);

      let created = 0;
      let updated = 0;
      let skipped = 0;

      for (const icsEvent of events) {
        // Skip events in the past (more than 7 days ago) to avoid importing history
        if (icsEvent.dtstart && icsEvent.dtstart < new Date(Date.now() - 7 * 86400000)) {
          skipped++;
          continue;
        }

        const existing = await prisma.syncedEvent.findUnique({
          where: { feedId_externalUid: { feedId: feed.id, externalUid: icsEvent.uid } },
        });

        if (existing) {
          // Update the existing event with any new data
          await prisma.event.update({
            where: { id: existing.eventId },
            data: {
              name: icsEvent.summary,
              date: icsEvent.dtstart || undefined,
              nextSteps: icsEvent.description
                ? `Synced from ${feed.name}\n\n${icsEvent.description.slice(0, 500)}`
                : undefined,
            },
          });
          await prisma.syncedEvent.update({
            where: { id: existing.id },
            data: { lastSeen: new Date() },
          });
          updated++;
        } else {
          // Parse location into venue lookup
          let venueId: string | null = null;
          if (icsEvent.location) {
            const venueName = icsEvent.location.split(",")[0].trim();
            if (venueName) {
              const existingVenue = await prisma.venue.findFirst({
                where: { name: { equals: venueName } },
              });
              if (existingVenue) {
                venueId = existingVenue.id;
              } else {
                const newVenue = await prisma.venue.create({
                  data: { name: venueName },
                });
                venueId = newVenue.id;
              }
            }
          }

          const event = await prisma.event.create({
            data: {
              name: icsEvent.summary,
              status: "not_started",
              audience: "all_members",
              date: icsEvent.dtstart || null,
              venueId,
              lumaUrl: icsEvent.url || null,
              nextSteps: icsEvent.description
                ? `Synced from ${feed.name}\n\n${icsEvent.description.slice(0, 500)}`
                : `Synced from ${feed.name}`,
            },
          });

          await prisma.syncedEvent.create({
            data: {
              externalUid: icsEvent.uid,
              feedId: feed.id,
              eventId: event.id,
            },
          });
          created++;
        }
      }

      await prisma.calendarFeed.update({
        where: { id: feed.id },
        data: {
          lastSyncAt: new Date(),
          lastError: null,
          eventCount: events.length,
        },
      });

      results.push({
        feed: feed.name,
        total: events.length,
        created,
        updated,
        skipped,
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      await prisma.calendarFeed.update({
        where: { id: feed.id },
        data: { lastError: errMsg },
      });
      results.push({ feed: feed.name, error: errMsg });
    }
  }

  return NextResponse.json({ synced: results });
}

// GET also triggers sync (for Vercel Cron compatibility)
export async function GET(request: NextRequest) {
  return POST(request);
}
