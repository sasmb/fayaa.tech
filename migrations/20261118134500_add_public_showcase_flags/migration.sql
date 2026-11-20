-- AlterTable
ALTER TABLE "User" ADD COLUMN     "canPublishPublic" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "File" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "VideoTask" ADD COLUMN     "featuredOnHome" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "posterUrl" TEXT,
ADD COLUMN     "publicCategory" TEXT,
ADD COLUMN     "publicTitle" TEXT,
ADD COLUMN     "storageKey" TEXT;

-- CreateIndex
CREATE INDEX "File_isPublic_idx" ON "File"("isPublic");

-- CreateIndex
CREATE INDEX "VideoTask_isPublic_featuredOnHome_idx" ON "VideoTask"("isPublic", "featuredOnHome");
