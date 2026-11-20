-- CreateTable
CREATE TABLE "LongVideoJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SPLITTING',
    "variant" TEXT NOT NULL DEFAULT 'light',
    "resolution" TEXT NOT NULL DEFAULT '480p',
    "prompt" TEXT,
    "sourceVideoUrl" TEXT NOT NULL,
    "referenceImageUrls" TEXT[],
    "trimStartSec" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalDurationSec" DOUBLE PRECISION NOT NULL,
    "segmentCount" INTEGER NOT NULL,
    "completedCount" INTEGER NOT NULL DEFAULT 0,
    "creditCost" INTEGER NOT NULL,
    "creditsRefunded" BOOLEAN NOT NULL DEFAULT false,
    "outputVideoUrl" TEXT,
    "outputStorageKey" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LongVideoJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LongVideoSegment" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "startSec" DOUBLE PRECISION NOT NULL,
    "durationSec" DOUBLE PRECISION NOT NULL,
    "clipSourceUrl" TEXT,
    "requestId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "outputVideoUrl" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LongVideoSegment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LongVideoJob_userId_idx" ON "LongVideoJob"("userId");

-- CreateIndex
CREATE INDEX "LongVideoJob_status_idx" ON "LongVideoJob"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LongVideoSegment_requestId_key" ON "LongVideoSegment"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "LongVideoSegment_jobId_index_key" ON "LongVideoSegment"("jobId", "index");

-- CreateIndex
CREATE INDEX "LongVideoSegment_status_idx" ON "LongVideoSegment"("status");

-- AddForeignKey
ALTER TABLE "LongVideoJob" ADD CONSTRAINT "LongVideoJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LongVideoSegment" ADD CONSTRAINT "LongVideoSegment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "LongVideoJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
