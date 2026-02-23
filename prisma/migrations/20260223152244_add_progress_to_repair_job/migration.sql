-- AlterTable
ALTER TABLE "repair_jobs" ADD COLUMN     "customer_confirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "progress" INTEGER NOT NULL DEFAULT 0;
