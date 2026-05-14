/*
  Warnings:

  - You are about to drop the column `defaultCategory` on the `Organization` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Organization" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "taxId" TEXT
);
INSERT INTO "new_Organization" ("address", "id", "name", "taxId") SELECT "address", "id", "name", "taxId" FROM "Organization";
DROP TABLE "Organization";
ALTER TABLE "new_Organization" RENAME TO "Organization";
CREATE UNIQUE INDEX "Organization_name_key" ON "Organization"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
