/*
  Warnings:

  - You are about to drop the column `tipe` on the `Images` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Images" DROP COLUMN "tipe",
ADD COLUMN     "type" TEXT;
