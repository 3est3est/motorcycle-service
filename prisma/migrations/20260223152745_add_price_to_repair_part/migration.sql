/*
  Warnings:

  - Added the required column `price_total` to the `repair_parts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit_price` to the `repair_parts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "repair_parts" ADD COLUMN     "price_total" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "unit_price" DECIMAL(10,2) NOT NULL;
