# Donation Tracker

A secure, local-first application for tracking charitable donations, designed as a modern replacement for Intuit's discontinued "ItsDeductible" service.

## 🚀 The Vibe
This application was "vibe-coded" into existence as a personal response to the retirement of ItsDeductible. It aims to provide the same ease of use for tracking non-cash, cash, and asset donations while adhering to modern security standards and keeping your financial data exactly where it belongs: **on your own machine.**

## 📖 User Guide & Documentation

We have compiled a comprehensive, multi-part User Guide to help you set up and get the most out of Donation Tracker:

1. **[Getting Started](docs/getting-started.md)**: Platform installation, database and receipt photo storage locations, tax profile setup, and understanding OBBBA regulatory calculations (0.5% AGI Floor, benefit caps, and ceilings).
2. **[Using Donation Tracker](docs/user-guide.md)**: Navigating the dashboard states, recording physical items (catalog search & custom items), cash, stock donations, and managing history.
3. **[Reports & Sync](docs/reports-and-sync.md)**: Generating annual tax reports (Form 8283 prep), print-friendly pages, CSV flat exports, and multi-machine sync procedures.

## ✨ Features

- **Item Catalog:** A searchable directory of over 1,700 items with Fair Market Values (FMV) pre-seeded from industry-standard data. Easily add and save your own custom items if they aren't in the default catalog.
- **Donation Ledger:** Track physical items, cash contributions, and asset transfers (stocks/securities) in one central place.
- **Organization Management:** Maintain a directory of your favorite charities, including Tax IDs and addresses.
- **Receipt & Photo Attachments:** Securely attach local images and receipts to your donation events. Photos are copied to a private local storage directory, with automatic cleanup of image files when events are deleted to prevent storage leaks.
- **Interactive Dashboard:** View annual summaries of your giving, broken down by type and organization.
- **OBBBA-Compliant Tax Savings Engine (2026+):** Estimate tax savings dynamically based on AGI and  One Big Beautiful Bill Act compliance rules.
- **AGI-Based Deduction Floor & Ceilings:** Automatically track progress against a statutory AGI floor (0.5% of AGI) before deductions kick in, and enforce cascading contribution ceilings (30% for assets/stocks, 50% for physical items, and 60% for cash) with carryover notifications.
- **Visual Progress Indicators:** View interactive progress bars on the dashboard indicating how close you are to clearing your deduction floor and maximizing statutory ceilings.
- **Data Import & Export (Sync Packages):** Export your entire database (seeded/custom catalog items, charities, events, and receipts) to a compressed `.dtpack` file, and seamlessly import/merge data from other devices with automatic duplicate detection and database safety rollbacks.
- **Annual Tax Reporting:** Generate IRS-compliant annual summaries grouped by organization and date. Includes print-optimized layouts and CSV export for data portability.

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
- macOS, Windows, or Linux (cross-platform building is fully supported)

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize the development database and seed the catalog:
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```
   > [!NOTE]
   > **How Database Environments Work:**
   > - **`dev.db`** (stored in `prisma/dev.db`) is the local sandbox database for development and testing. The default path is set in `.env` (which is tracked by Git) so that Prisma CLI commands (`migrate`, `seed`, etc.) work out of the box.
   > - **`production.db`** is the database used when running the packaged application (Electron desktop or Docker). This separation ensures developer activity never alters your real tax data.

4. **Set Access Password:**
   Start the development server (see below). On your first launch in the browser, you will be automatically prompted by a setup wizard to configure your local access password.

   The Setup Wizard automatically generates a secure `AUTH_SECRET` and writes it along with your chosen `APP_PASSWORD` to a `.env.local` file in your root folder (which is ignored by Git).
   
   *Tip: If you want to bypass the wizard or pre-configure these manually, you can copy the `.env.sample` file to `.env.local` and define them there before running.*

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

#### Docker Mode (Self-Hosted)
For self-hosting or running in a headless environment, you can run the application as a Docker container. See [🐳 Running with Docker](#-running-with-docker) below for details.

### 📦 Building for Desktop

To create a packaged desktop application for your platform:

#### macOS (`.app` and `.dmg`):
1. **Prerequisites:** Install `gettext` via Homebrew for DMG packaging:
   ```bash
   brew install gettext
   ```
2. **Build:**
   ```bash
   npm run desktop:build
   ```

#### Windows (`.exe`):
1. **Build:**
   ```bash
   npm run desktop:build
   ```

#### Linux (`.deb`):
1. **Build:**
   ```bash
   npm run desktop:build
   ```

The output will be generated in the `dist/` directory.

### 🖥️ Desktop Configuration (Production)

When running the packaged desktop application, environment variables from `.env.local` are not loaded. The app uses an automated configuration system where the database (`production.db`) and configuration (`config.json`) are stored in the platform's standard user data directory:

- **macOS:** `~/Library/Application Support/Donation Tracker`
- **Windows:** `%APPDATA%\Donation Tracker` (e.g., `C:\Users\<username>\AppData\Roaming\Donation Tracker`)
- **Linux:** `~/.config/Donation Tracker`

An `AUTH_SECRET` is automatically generated if missing, and a Setup Wizard will guide you to configure your `APP_PASSWORD` on first launch (saving it to `config.json`).

#### Setting the Access Password manually
Alternatively, if you prefer to bypass the setup GUI, you can set your password for the first time by launching the app once from the terminal with the `APP_PASSWORD` environment variable. This will persist the password in `config.json` for all subsequent GUI launches:

- **macOS:**
  ```bash
  APP_PASSWORD=your_password /Applications/Donation\ Tracker.app/Contents/MacOS/Donation\ Tracker
  ```
- **Windows (PowerShell):**
  ```powershell
  $env:APP_PASSWORD="your_password"; & "$env:USERPROFILE\AppData\Local\Programs\donation-tracker\Donation Tracker.exe"
  ```
- **Linux:**
  ```bash
  APP_PASSWORD=your_password donation-tracker
  ```

## 🐳 Running with Docker

As an alternative to running the Electron packaged desktop application, you can build and run a lightweight, standalone, platform-independent Docker container. This is ideal for self-hosting on a home server, NAS, or local machine.

### Prerequisites
- Docker installed on your host system.

### Using Docker Compose (Recommended)

To run the application using Docker Compose:

1. **Start the service:**
   Run the following command from the root of the repository to start the container in the background:
   ```bash
   docker compose up -d
   ```
   This will pull the latest pre-built container image and launch the service.

2. **Configure (Optional):**
   Open the `docker-compose.yml` file to configure:
   * **`APP_PASSWORD`**: The master password used to log in. Change `your_secure_password` to your own password.
   * **`NEXTAUTH_URL`**: Set to `http://localhost:3000` by default. For network access from other machines, change `localhost` to the host's local IP address (e.g. `http://192.168.1.100:3000`).
   * **`volumes`**: Mounts `./local-data` in the host directory to `/app/data` inside the container, preserving your database and uploads.

3. **Manage the container:**
   * **Stop:** `docker compose down`
   * **Logs:** `docker compose logs -f`

---

### Running via Docker CLI (Manual)

#### Downloading the Pre-built Image from GHCR
Multi-architecture container images (supporting both `linux/amd64` and `linux/arm64` / Apple Silicon) are automatically built and published to GitHub Container Registry (GHCR).

1. **Pull the latest image:**
   ```bash
   docker pull ghcr.io/padolph/donation-tracker:latest
   ```

2. **Run the container:**
   Make sure to pass a secure password via the `APP_PASSWORD` environment variable, and mount a persistent local directory to `/app/data` to store your SQLite database and uploaded receipts safely:
   ```bash
   docker run -d \
     --name donation-tracker \
     -p 3000:3000 \
     -e APP_PASSWORD="your_secure_password" \
     -e NEXTAUTH_URL="http://<YOUR_SERVER_IP>:3000" \
     -v </path/to/local/storage>:/app/data \
     ghcr.io/padolph/donation-tracker:main
   ```   
   * **`APP_PASSWORD`**: The master password you will use to log into the application.
   * **`NEXTAUTH_URL`**: **(Required for Network Access)** Replace `<YOUR_SERVER_IP>` with the local IP address of the machine running Docker (e.g., `192.168.1.100`). NextAuth uses this to securely sign tokens and handle internal redirects. If you only intend to access the app on the same machine running Docker, you can use `http://localhost:3000`.
   * **`-v` (Volume Mount)**: Replace `</path/to/local/storage>` with the absolute path to a folder on your host machine where you want your SQLite database and uploaded attachments to live permanently.   

Open [http://<YOUR_SERVER_IP>:3000](http://localhost:3000) in your browser.

### Building the Image Locally
If you want to build the container from source locally:

1. **Build the image:**
   ```bash
   docker build -t donation-tracker .
   ```

2. **Run your local build:**
   ```bash
   docker run -d \
     --name donation-tracker \
     -p 3000:3000 \
     -e APP_PASSWORD=your_secure_password \
     -v $(pwd)/local-data:/app/data \
     donation-tracker:latest
   ```

### Persistent Data Structure
When the container starts up for the first time, it automatically creates and seeds the SQLite database (`production.db`) and creates the image upload directory (`donations/`) inside your mounted `/app/data` volume:
- SQLite Database path: `/app/data/production.db`
- Image uploads path: `/app/data/donations`

## 🧪 Testing

The project uses Jest and React Testing Library for comprehensive test coverage.
```bash
npm test
```

---
*Built with ❤️ as a secure, personal tool for better giving.*
