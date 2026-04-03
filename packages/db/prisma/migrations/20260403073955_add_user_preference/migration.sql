/*
  Warnings:

  - You are about to drop the column `content` on the `Message` table. All the data in the column will be lost.
  - Added the required column `parts` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RetentionPolicy" AS ENUM ('ONE_YEAR', 'SIX_MONTHS', 'THIRTY_DAYS', 'MANUAL_ONLY');

-- AlterTable
ALTER TABLE "ChatSession" ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "content",
ADD COLUMN     "parts" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" TIMESTAMP(3),
ADD COLUMN     "image" TEXT,
ADD COLUMN     "retentionPolicy" "RetentionPolicy" NOT NULL DEFAULT 'ONE_YEAR',
ALTER COLUMN "password" DROP NOT NULL;

-- CreateTable
CREATE TABLE "UserPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "aiProvider" TEXT NOT NULL DEFAULT 'xiaomi',
    "aiModel" TEXT NOT NULL DEFAULT 'mimo-v2-flash',
    "aiApiKey" TEXT,
    "aiBaseUrl" TEXT,
    "personaName" TEXT NOT NULL DEFAULT 'Eveheart',
    "replyLanguage" TEXT NOT NULL DEFAULT 'zh-CN',
    "voiceEnabled" BOOLEAN NOT NULL DEFAULT true,
    "voiceSpeed" TEXT NOT NULL DEFAULT 'normal',
    "fontSize" TEXT NOT NULL DEFAULT 'standard',
    "elderlyMode" BOOLEAN NOT NULL DEFAULT false,
    "highContrast" BOOLEAN NOT NULL DEFAULT false,
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT false,
    "reminderTime" TEXT NOT NULL DEFAULT '20:00',
    "reminderFreq" TEXT NOT NULL DEFAULT 'daily',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferences_userId_key" ON "UserPreferences"("userId");

-- AddForeignKey
ALTER TABLE "UserPreferences" ADD CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
