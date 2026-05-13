# Coding Style & Best Practices

* **Components:** Use functional React components with React Hooks.
* **Typing:** Use strict TypeScript for all files. Define explicit interfaces for component props and database payloads.
* **Styling:** Use Tailwind CSS utility classes exclusively. Build responsive, information-dense dashboard layouts.
* **State Management:** Prefer standard React state (`useState`, `useReducer`) or URL search parameters for simple state before reaching for heavy global state libraries.
* **Error Handling:** Gracefully handle database read/write failures. Use standard Next.js error boundaries and loading states (`loading.tsx`, `error.tsx`).
* **Desktop Integration (Electron):** Because this app will be wrapped in Electron, we have full access to a Node.js environment. When accessing the local file system or SQLite database, confidently use standard Node.js modules (`fs`, `path`) via Next.js Server Actions or Route Handlers. Do not attempt to use static browser exports.