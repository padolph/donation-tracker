# Task: Fix Electron Production White Screen (Bundled Server Pattern)

## Context
The Electron desktop app works perfectly in development (`desktop:dev`), but displays a white screen in production after running `electron-builder`. This is because:
1. The Next.js server is not being explicitly started in the packaged application.
2. Prisma's native query engines and the `.next` build folder are trapped inside the read-only `.asar` archive and cannot execute.

## Requirements

### 1. Update `package.json` (electron-builder config)
Add or update the `"build"` configuration block in `package.json` to configure `electron-builder`:
- Set `"asar": true`.
- Add an `"asarUnpack"` array that explicitly unpacks:
  - `"node_modules/@prisma/engines/**/*"`
  - `"node_modules/@prisma/client/**/*"`
  - `"prisma/**/*"`
  - `".next/**/*"`

### 2. Update `electron/main.ts`
Modify the existing `main.ts` file to handle the production server boot sequence:
- Check if the app is packaged using `app.isPackaged`.
- **If in development:** Continue relying on `concurrently` (localhost:3000).
- **If packaged (Production):** - Dynamically resolve the path to the unpacked Next.js directory (`app.asar.unpacked`).
  - Use Node's `child_process.fork` or `spawn` to start the Next.js production server (equivalent to `next start`).
  - Automatically assign a dynamic open port (do not hardcode port 3000 to prevent conflicts with other apps).
  - Wait for the server to emit a ready signal on that dynamic port, then load `http://localhost:{dynamicPort}` into the `BrowserWindow`.

### 3. Strict Constraints
- **DO NOT** convert Next.js to a static export (`output: export`). We must maintain the full Node server for Prisma to work.
- **DO NOT** modify the database schema or React components.
- Gracefully kill the Next.js child process when the Electron `app` emits the `window-all-closed` or `quit` events to prevent zombie processes.
