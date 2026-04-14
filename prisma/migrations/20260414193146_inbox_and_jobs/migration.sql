-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "company" TEXT,
    "description" TEXT,
    "location" TEXT,
    "salary" TEXT,
    "applyUrl" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InboxItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "messageId" TEXT,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "parsedData" TEXT,
    "createdEventId" TEXT,
    "createdJobId" TEXT,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "InboxItem_messageId_key" ON "InboxItem"("messageId");
