-- AlterTable
ALTER TABLE "DonationEvent" ADD COLUMN "mileageRate" REAL DEFAULT 0.14;
ALTER TABLE "DonationEvent" ADD COLUMN "milesDriven" REAL;
ALTER TABLE "DonationEvent" ADD COLUMN "parkingAndTolls" REAL;
