-- CreateTable
CREATE TABLE "SiteMedia" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "slot" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tag" TEXT NOT NULL DEFAULT '',
    "videoUrl" TEXT,
    "posterUrl" TEXT,
    "aspect" TEXT NOT NULL DEFAULT 'landscape',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "creditName" TEXT,
    "sourceUrl" TEXT,
    "platform" TEXT,

    CONSTRAINT "SiteMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteMedia_slot_enabled_sortOrder_idx" ON "SiteMedia"("slot", "enabled", "sortOrder");
