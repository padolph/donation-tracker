# Task: Scaffold Electron Wrapper (Bundled Server Pattern)

## Context
This is a feature-complete Next.js 16 (App Router) project using Prisma and SQLite. We are migrating it to a desktop application using Electron via the "Bundled Server Pattern."
All required packages (`electron`, `electron-builder`, `concurrently`, `wait-on`) are already installed. **DO NOT run `npm install`.**

## Requirements

### 1. File Structure & TypeScript
- Create a new directory called `electron/` at the project root.
- Inside, create `electron/main.ts`.
- Create a `tsconfig.electron.json` file specifically to compile the Electron main process to a `dist-electron/` folder without interfering with the Next.js `tsconfig.json`.

### 2. Electron Main Process (`electron/main.ts`)
- Must wait for `http://localhost:3000` to be available, then load it into the BrowserWindow.
- Must enforce security best practices: `nodeIntegration: false`, `contextIsolation: true`.
- Set default window dimensions to 1200x800.

### 3. NPM Scripts (Update `package.json`)
Do not touch existing `dev`, `build`, or `start` scripts. Add the following new scripts:
- `"electron:tsc"`: Compiles the `electron/main.ts` file using the new tsconfig.
- `"desktop:dev"`: Uses `concurrently` to run `"npm run dev"` alongside a command that compiles the electron code, waits for tcp:3000, and launches electron (`electron .`).
- `"desktop:build"`: Placeholder for `electron-builder` compilation.

### 4. Strict Constraints
- **DO NOT** modify anything inside the `src/` directory.
- **DO NOT** alter Prisma schemas or Next.js configuration files.
- Strictly output the `electron/main.ts` code, the `tsconfig.electron.json` config, and the specific `package.json` script updates.
