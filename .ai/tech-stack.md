# Tech Stack Guidelines

* **Frontend Framework:** Next.js (App Router, using the `src/` directory).
* **Desktop Environment:** Tauri v2 targeting macOS. The Next.js app must be compatible with Tauri's static export requirements.
* **Database:** SQLite (local file, e.g., `dev.db`).
* **ORM:** Prisma.
* **Styling:** Tailwind CSS.
* **Authentication:** NextAuth.js (Auth.js) using a custom Credentials provider linked to a hardcoded `.env.local` password.
* **File System:** Use Tauri's native `fs` and `path` APIs to read/write local files (specifically for copying and referencing user-uploaded photos).

