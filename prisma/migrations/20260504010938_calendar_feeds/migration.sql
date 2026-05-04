-- CreateTable
CREATE TABLE "CalendarFeed" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'ical',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" DATETIME,
    "lastError" TEXT,
    "eventCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SyncedEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "externalUid" TEXT NOT NULL,
    "feedId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "lastSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "CalendarFeed_url_key" ON "CalendarFeed"("url");

-- CreateIndex
CREATE UNIQUE INDEX "SyncedEvent_feedId_externalUid_key" ON "SyncedEvent"("feedId", "externalUid");
