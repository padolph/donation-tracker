# Donation Tracker

A secure, local-first application for tracking charitable donations, designed as a modern replacement for Intuit's discontinued "ItsDeductible" service.

## 🚀 The Vibe
This application was "vibe-coded" into existence as a personal response to the retirement of ItsDeductible. It aims to provide the same ease of use for tracking non-cash, cash, and asset donations while adhering to modern security standards and keeping your financial data exactly where it belongs: **on your own machine.**

## ✨ Features

- **Item Catalog:** A searchable directory of over 1,700 items with Fair Market Values (FMV) pre-seeded from industry-standard data.
- **Donation Ledger:** Track physical items, cash contributions, and asset transfers (stocks/securities) in one central place.
- **Organization Management:** Maintain a directory of your favorite charities, including Tax IDs and addresses.
- **Receipt & Photo Attachments:** Securely attach local images and receipts to your donation events. Photos are copied to a private local storage directory, with automatic cleanup of image files when events are deleted to prevent storage leaks.
- **Interactive Dashboard:** View annual summaries of your giving, broken down by type and organization.
- **OBBBA-Compliant Tax Savings Engine (2026+):** Estimate tax savings dynamically based on AGI and  One Big Beautiful Bill Act compliance rules.
- **AGI-Based Deduction Floor & Ceilings:** Automatically track progress against a statutory AGI floor (0.5% of AGI) before deductions kick in, and enforce cascading contribution ceilings (30% for assets/stocks, 50% for physical items, and 60% for cash) with carryover notifications.
- **Visual Progress Indicators:** View interactive progress bars on the dashboard indicating how close you are to clearing your deduction floor and maximizing statutory ceilings.
- **Data Import & Export (Sync Packages):** Export your entire database (seeded/custom catalog items, charities, events, and receipts) to a compressed `.dtpack` file, and seamlessly import/merge data from other devices with automatic duplicate detection and database safety rollbacks.
- **First-Run Setup Wizard:** Configure a secure access password directly inside the app on first launch, without needing to pre-configure environment variables manually.
- **Annual Tax Reporting:** Generate IRS-compliant annual summaries grouped by organization and date. Includes print-optimized layouts and CSV export for data portability.
- **Custom Items:** Easily add and save your own items if they aren't in the default catalog.
- **Sidebar Version Indicator:** Display the current application version dynamically at the bottom of the navigation sidebar.

## 🛠️ Tech Stack

- **Frontend:** [Next.js](https://nextjs.org/) (App Router)
- **Desktop Wrapper:** [Electron](https://www.electronjs.org/) (Bundled Server Pattern)
- **Database:** [SQLite](https://sqlite.org/) via [Prisma ORM](https://www.prisma.io/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Runtime:** Node.js

## 🔒 Security & Privacy

- **Local-First:** All data, including your donation history and receipt photos, is stored locally on your machine.
- **Offline Capable:** No internet connection is required for core functionality.
- **Password Protected:** Access to the application is secured via a simple password check.
- **No Cloud Sync:** Your sensitive financial data is never uploaded to any cloud service.

## 📦 Data Seeding

The item database is seeded using data historically provided by Intuit's ItsDeductible service, ensuring that Fair Market Value estimates for clothing, household goods, and other items are consistent with common tax preparation standards.

## 🚦 Getting Started

### Prerequisites

- Node.js (LTS version recommended)
- npm or yarn
- macOS (for DMG building, though it can run on other platforms)

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables for development:
   Create a `.env.local` file in the root directory. You can generate a secure `AUTH_SECRET` using `npx auth secret`.
   ```env
   # Optional: Can also be set during first-run setup wizard in browser
   APP_PASSWORD=your_secure_password
   AUTH_SECRET=your_generated_secret
   DATABASE_URL="file:./prisma/dev.db"
   ```
4. Initialize the database and seed the catalog:
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```
5. **Set Access Password:**
   On your first launch in the browser, you will be automatically prompted by a setup wizard to configure your local access password. Alternatively, pre-configure it via `APP_PASSWORD` in `.env.local`.

### Running the App

#### Web Mode (Browser)
Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Desktop Mode (Electron)
Start the app in a desktop window:
```bash
npm run desktop:dev
```

### 📦 Building for Desktop

To create a packaged macOS application (`.app` and `.dmg`):

1. **Prerequisites:** Install `gettext` via Homebrew for DMG packaging:
   ```bash
   brew install gettext
   ```
2. **Build:**
   ```bash
   npm run desktop:build
   ```
The output will be in the `dist/` directory.

### 🖥️ Desktop Configuration (Production)

When running the packaged `.app`, environment variables from `.env.local` are not loaded. The app uses a persistent configuration system:

- **Database:** Your data is migrated to `~/Library/Application Support/Donation Tracker/database.db`.
- **Password:** The `APP_PASSWORD` is stored in `config.json` in the same directory.
- **Setting the Password:** To set your password for the first time in the packaged app, run it once from the terminal:
  ```bash
  APP_PASSWORD=your_password /Applications/Donation\ Tracker.app/Contents/MacOS/Donation\ Tracker
  ```
  The app will save this password and use it for all future GUI launches.

## 🧪 Testing

The project uses Jest and React Testing Library for comprehensive test coverage.
```bash
npm test
```

---
*Built with ❤️ as a secure, personal tool for better giving.*
