-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "audience" TEXT NOT NULL DEFAULT 'all_members',
    "date" DATETIME,
    "lumaUrl" TEXT,
    "planningDoc" TEXT,
    "photosUrl" TEXT,
    "nextSteps" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "venueId" TEXT,
    CONSTRAINT "Event_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "capacity" INTEGER,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "role" TEXT,
    "linkedinUrl" TEXT,
    "source" TEXT,
    "tags" TEXT,
    "leadScore" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EventGuest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rsvpStatus" TEXT NOT NULL DEFAULT 'pending',
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "checkedInAt" DATETIME,
    "dietaryNeeds" TEXT,
    "plusOnes" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    CONSTRAINT "EventGuest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventGuest_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sponsor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "tier" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "logoUrl" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EventSponsor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commitment" TEXT,
    "amount" REAL,
    "deliverables" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventId" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    CONSTRAINT "EventSponsor_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventSponsor_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TicketTier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "capacity" INTEGER,
    "sold" INTEGER NOT NULL DEFAULT 0,
    "stripeProductId" TEXT,
    "stripePriceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventId" TEXT NOT NULL,
    CONSTRAINT "TicketTier_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Menu" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventId" TEXT NOT NULL,
    CONSTRAINT "Menu_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "dietaryTags" TEXT,
    "quantity" INTEGER,
    "menuId" TEXT NOT NULL,
    CONSTRAINT "MenuItem_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OutreachCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'invite',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "eventId" TEXT NOT NULL,
    CONSTRAINT "OutreachCampaign_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OutreachTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL DEFAULT 1,
    "delayDays" INTEGER NOT NULL DEFAULT 0,
    "campaignId" TEXT NOT NULL,
    CONSTRAINT "OutreachTemplate_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "OutreachCampaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OutreachMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subject" TEXT,
    "body" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" DATETIME,
    "openedAt" DATETIME,
    "repliedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campaignId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    CONSTRAINT "OutreachMessage_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "OutreachCampaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OutreachMessage_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Contact_email_key" ON "Contact"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EventGuest_eventId_contactId_key" ON "EventGuest"("eventId", "contactId");

-- CreateIndex
CREATE UNIQUE INDEX "EventSponsor_eventId_sponsorId_key" ON "EventSponsor"("eventId", "sponsorId");
