/*
  Warnings:

  - You are about to drop the column `betOutcome` on the `Stake` table. All the data in the column will be lost.
  - Added the required column `joiningAmount` to the `PlayerGame` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Stake_gameId_betOutcome_idx";

-- AlterTable
ALTER TABLE "public"."PlayerGame" ADD COLUMN     "joiningAmount" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "public"."Stake" DROP COLUMN "betOutcome",
ADD COLUMN     "winningamount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "isonboarded" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."StakerGame" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "gameId" INTEGER NOT NULL,

    CONSTRAINT "StakerGame_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StakerGame_gameId_idx" ON "public"."StakerGame"("gameId");

-- CreateIndex
CREATE INDEX "Stake_gameId_idx" ON "public"."Stake"("gameId");

-- AddForeignKey
ALTER TABLE "public"."StakerGame" ADD CONSTRAINT "StakerGame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StakerGame" ADD CONSTRAINT "StakerGame_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
