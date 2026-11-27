-- AlterTable
ALTER TABLE "LongVideoJob" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "previewFirst" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "previewVideoUrl" TEXT;
