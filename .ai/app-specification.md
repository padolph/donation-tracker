# App Specification: Donation Tracker (ItsDeductible Clone)

## Core Features
1. **Authentication:** A single-user local app protected by Next.js Middleware. Requires a single password matching `APP_PASSWORD` in `.env.local` to access the application.
2. **Item Catalog:** A searchable directory of items seeded with default High and Medium Fair Market Values. Users can override these values or create net-new custom items.
3. **Donation Ledger:** Users create Donation Events (Date, Organization). They can add quantities of items to an event, which permanently locks in the *current* FMV of those items at the time of donation.
4. **Receipt Storage:** Users can attach local image files (receipts/photos) to a Donation Event. The app must copy these files to a secure local application directory and store the path reference in the database.

## Prisma Database Schema
Use the following relational structure:

\`\`\`prisma
model Category {
  id    Int    @id @default(autoincrement())
  name  String @unique
  items Item[]
}

model Item {
  id             Int      @id @default(autoincrement())
  categoryId     Int
  description    String
  defaultHigh    Float?   // Seeded from original FMV guide
  defaultMedium  Float?   // Seeded from original FMV guide
  userHigh       Float?   // User override
  userMedium     Float?   // User override
  isCustomItem   Boolean  @default(false)
  
  category       Category @relation(fields: [categoryId], references: [id])
  donatedItems   DonatedItem[]
}

model DonationEvent {
  id           Int      @id @default(autoincrement())
  date         DateTime
  organization String   // e.g., "Goodwill"
  notes        String?
  items        DonatedItem[]
  photos       EventPhoto[]
}

model EventPhoto {
  id        Int           @id @default(autoincrement())
  eventId   Int
  filePath  String        // The local path where Tauri saved the image copy
  
  event     DonationEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)
}

model DonatedItem {
  id            Int           @id @default(autoincrement())
  eventId       Int
  itemId        Int
  quantity      Int           @default(1)
  condition     String        // "High" or "Medium"
  lockedValue   Float         // The calculated value of a SINGLE item at the time of donation
  
  event         DonationEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)
  item          Item          @relation(fields: [itemId], references: [id])
}
\`\`\`

