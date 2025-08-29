/*
  Warnings:

  - You are about to drop the column `urls` on the `Images` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Images" DROP COLUMN "urls",
ADD COLUMN     "url" TEXT;
