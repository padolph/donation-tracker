-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Item" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "categoryId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "leafName" TEXT NOT NULL DEFAULT '',
    "defaultHigh" REAL,
    "defaultMedium" REAL,
    "userHigh" REAL,
    "userMedium" REAL,
    "isCustomItem" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Item_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Item" ("categoryId", "defaultHigh", "defaultMedium", "description", "id", "isCustomItem", "userHigh", "userMedium") SELECT "categoryId", "defaultHigh", "defaultMedium", "description", "id", "isCustomItem", "userHigh", "userMedium" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
