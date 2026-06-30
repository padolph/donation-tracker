# Contributing to Donation Tracker

First off, thank you for considering contributing to Donation Tracker! Community contributions help make this tool more robust, secure, and useful for everyone.

Please review this document to understand our development workflow, standards, and submission guidelines.

---

## 🛠️ Local Development Setup

### Prerequisites
- **Node.js** (LTS version, Node 22+ recommended)
- **npm** (comes bundled with Node.js)
- **macOS** (optional, but required if you want to package the app for macOS using DMG targets)

### Setup Steps
1. **Fork and Clone** the repository:
   ```bash
   git clone https://github.com/your-username/donation-tracker.git
   cd donation-tracker
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables (Optional)**:
   By default, local development does not require you to pre-configure any environment variables. The default development database path (`prisma/dev.db`) is preconfigured in `.env` (which is tracked by Git) so Prisma CLI commands work out of the box.

   When starting the development server, a first-run Setup Wizard in the browser will guide you to configure your password and automatically create the `.env.local` file for you.

   If you prefer to pre-configure these manually:
   - Copy `.env.sample` to `.env.local`: `cp .env.sample .env.local`
   - Set your preferred `APP_PASSWORD` and `AUTH_SECRET` (generate a secure random secret using `npx auth secret`) in `.env.local`.

4. **Initialize the SQLite Database & Seed Catalog**:
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

---

## 🚦 Development Workflow

We support running the app in two modes:

### Web Mode (Browser-only development)
This is the fastest way to work on UI changes, page layouts, and general frontend/backend features:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Desktop Mode (Electron wrapper development)
This runs the Next.js app inside the Electron desktop window. Use this when testing Electron IPC, menu integration, native window actions, or filesystem logic:
```bash
npm run desktop:dev
```

---

## 🧪 Testing and TDD

We maintain high test coverage using Jest and React Testing Library. We strongly encourage **Test-Driven Development (TDD)**:
1. Write or update tests *before* writing the implementation code.
2. Run tests to ensure they fail as expected.
3. Write the minimal code needed to pass the tests.
4. Refactor and ensure all tests stay passing.

Run the test suite:
```bash
npm test
```
To run tests in watch mode:
```bash
npm run test:watch
```

---

## 🛡️ Code Quality & Security Lints

This project is configured with security lint rules (`eslint-plugin-security`) to catch unsafe regular expressions, directory traversals, and potential injection issues early.

Run the linter to verify your changes conform to the rules:
```bash
npm run lint
```
Please ensure all lint checks pass before submitting a pull request.

---

## 📝 Commit Guidelines

We use **Conventional Commits** to keep our history clean and meaningful:
- `feat:` for new features (e.g., `feat(donations): add support for stock attachments`)
- `fix:` for bug fixes (e.g., `fix(linter): exclude build files from analysis`)
- `docs:` for documentation updates (e.g., `docs(contributing): add setup details`)
- `chore:` for repository maintenance tasks (e.g., `chore(deps): bump prisma to 5.22.0`)
- `test:` for adding or updating tests

Example commit message:
```text
feat(donations): relocates edit donation action to details subview
```
