/*
  Warnings:

  - A unique constraint covering the columns `[categoryId,description]` on the table `Item` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Item_categoryId_description_key" ON "Item"("categoryId", "description");
