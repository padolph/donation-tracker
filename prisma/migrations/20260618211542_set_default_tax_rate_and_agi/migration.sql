-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AppSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "marginalTaxRate" REAL NOT NULL DEFAULT 0.22,
    "estimatedAGI" REAL NOT NULL DEFAULT 100000.0,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AppSettings" ("estimatedAGI", "id", "marginalTaxRate", "updatedAt") SELECT "estimatedAGI", "id", "marginalTaxRate", "updatedAt" FROM "AppSettings";
DROP TABLE "AppSettings";
ALTER TABLE "new_AppSettings" RENAME TO "AppSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
