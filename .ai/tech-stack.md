# Tech Stack Guidelines

* **Frontend Framework:** Next.js (App Router, using the `src/` directory).
* **Desktop Environment:** Electron targeting macOS. The Next.js app will run in a standard Node.js server configuration inside the Electron wrapper.
* **Database:** SQLite (local file, e.g., `dev.db`).
* **ORM:** Prisma **(Strictly Version 5 - LTS)**. Do NOT attempt to use Prisma v7 or configure driver adapters like `libsql` or `better-sqlite3` in the constructor. Use the standard v5 binary engine pattern.
* **Styling:** Tailwind CSS.
* **Authentication:** NextAuth.js (Auth.js) using a custom Credentials provider linked to a hardcoded `.env.local` password.
* **File System:** Use standard Node.js `fs` and `path` APIs inside Next.js Server Actions to read/write local files (specifically for copying and referencing user-uploaded photos).
