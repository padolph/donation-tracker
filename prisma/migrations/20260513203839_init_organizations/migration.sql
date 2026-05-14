/*
  Warnings:

  - You are about to drop the column `organization` on the `DonationEvent` table. All the data in the column will be lost.
  - Added the required column `organizationId` to the `DonationEvent` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Organization" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "taxId" TEXT,
    "defaultCategory" TEXT
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DonationEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ITEMS',
    "cashAmount" REAL,
    "assetTicker" TEXT,
    "assetShares" REAL,
    "notes" TEXT,
    CONSTRAINT "DonationEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DonationEvent" ("date", "id", "notes") SELECT "date", "id", "notes" FROM "DonationEvent";
DROP TABLE "DonationEvent";
ALTER TABLE "new_DonationEvent" RENAME TO "DonationEvent";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Organization_name_key" ON "Organization"("name");
