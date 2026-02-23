/*
  Warnings:

  - A unique constraint covering the columns `[repair_job_id]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "payments_repair_job_id_key" ON "payments"("repair_job_id");
