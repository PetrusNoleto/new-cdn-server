-- CreateTable
CREATE TABLE "public"."Images" (
    "id" TEXT NOT NULL,
    "tipe" TEXT,
    "location" TEXT,
    "urls" TEXT,
    "processed" BOOLEAN DEFAULT false,
    "removeBackground" BOOLEAN DEFAULT false,
    "backgroundRemovedIn" TIMESTAMP(3),
    "backgroundRemovedUrl" TEXT,
    "webhookUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3),

    CONSTRAINT "Images_pkey" PRIMARY KEY ("id")
);
