# Next.js LTS Coding Standards (App Router)

## Architecture & Routing
* **App Router Exclusively:** Strictly use the `src/app` directory. Do not use the legacy `pages` directory.
* **Component Default:** Treat all components as React Server Components (RSC) by default. 
* **Client Boundary:** Use the `"use client"` directive ONLY when strictly necessary (e.g., for `useState`, `useEffect`, `onClick` handlers, or browser APIs like `window`). Push client boundaries as far down the component tree as possible (e.g., make the interactive button a client component, but leave the layout and list as server components).

## Data Fetching & Mutations
* **Direct Database Access:** Because this application runs in a unified Node.js environment, query the SQLite database directly inside Server Components using the Prisma Client. Do not build intermediary `/api/` REST routes just to fetch internal data for the UI.
* **Mutations via Server Actions:** Use Next.js Server Actions for all data mutations (e.g., saving a donation session, creating a new item). Define these in a separate file (e.g., `actions.ts`) with the `"use server"` directive at the top, and call them directly from your client components or forms.

## Stability & Predictability
* **No Experimental Features:** Do not suggest or implement features flagged as experimental in `next.config.ts` or the Next.js documentation (e.g., experimental Partial Prerendering, experimental React compiler). Stick to the stable LTS feature set.
* **Standard State Management:** Avoid complex global state libraries (like Redux or Zustand) unless absolutely necessary. For simple UI state (like search queries or active tabs), prefer using URL Search Parameters (`?query=shirt`) so the state is shareable and accessible by Server Components.
* **Cache Invalidation:** After performing a database mutation via a Server Action, use Next.js's native `revalidatePath` to clear the cache and immediately reflect the updated data in the UI.
