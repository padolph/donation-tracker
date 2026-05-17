# Donation Tracker

A secure, local-first application for tracking charitable donations, designed as a modern replacement for Intuit's discontinued "ItsDeductible" service.

## 🚀 The Vibe
This application was "vibe-coded" into existence as a personal response to the retirement of ItsDeductible. It aims to provide the same ease of use for tracking non-cash, cash, and asset donations while adhering to modern security standards and keeping your financial data exactly where it belongs: **on your own machine.**

## ✨ Features

- **Item Catalog:** A searchable directory of over 1,700 items with Fair Market Values (FMV) pre-seeded from industry-standard data.
- **Donation Ledger:** Track physical items, cash contributions, and asset transfers (stocks/securities) in one central place.
- **Organization Management:** Maintain a directory of your favorite charities, including Tax IDs and addresses.
- **Receipt & Photo Attachments:** Securely attach local images and receipts to your donation events. Photos are copied to a private local storage directory.
- **Interactive Dashboard:** View annual summaries of your giving, broken down by type and organization.
- **Annual Tax Reporting:** Generate IRS-compliant annual summaries grouped by organization and date. Includes print-optimized layouts and CSV export for data portability.
- **Tax Impact Widget:** Estimate your tax savings based on your marginal tax rate.
- **Custom Items:** Easily add and save your own items if they aren't in the default catalog.

## 🛠️ Tech Stack

- **Frontend:** [Next.js](https://nextjs.org/) (App Router)
- **Database:** [SQLite](https://sqlite.org/) via [Prisma ORM](https://www.prisma.io/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Runtime:** Node.js (with Electron-ready architecture for desktop use)

## 🔒 Security & Privacy

- **Local-First:** All data, including your donation history and receipt photos, is stored locally on your machine.
- **Offline Capable:** No internet connection is required for core functionality.
- **Password Protected:** Access to the application is secured via a simple password check (configured via environment variables).
- **No Cloud Sync:** Your sensitive financial data is never uploaded to any cloud service.

## 📦 Data Seeding

The item database is seeded using data historically provided by Intuit's ItsDeductible service, ensuring that Fair Market Value estimates for clothing, household goods, and other items are consistent with common tax preparation standards.

## 🚦 Getting Started

### Prerequisites

- Node.js (LTS version recommended)
- npm or yarn

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   Create a `.env.local` file in the root directory:
   ```env
   APP_PASSWORD=your_secure_password
   DATABASE_URL="file:./prisma/dev.db"
   ```
4. Initialize the database and seed the catalog:
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

### Running the App

Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Testing

The project uses Jest and React Testing Library for comprehensive test coverage.
```bash
npm test
```

---
*Built with ❤️ as a secure, personal tool for better giving.*
