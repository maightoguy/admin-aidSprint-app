# Project Handover & Architecture Summary

## 🏗 Project Overview
**AidSprint Admin App** is a production-ready, full-stack React application template designed for the administrative dashboard. It utilizes a modern frontend stack paired with an integrated Express server for API handling, making it a highly robust single-page application (SPA).

### Tech Stack
- **Package Manager:** PNPM / NPM
- **Frontend Framework:** React 18 + Vite
- **Routing:** React Router v6 (SPA mode)
- **Styling:** Tailwind CSS v3 + Radix UI (Shadcn UI components)
- **State/Data Management:** React Query (`@tanstack/react-query`)
- **Backend:** Express server integrated with the Vite dev server
- **Language:** TypeScript across the entire stack (Client, Server, and Shared)
- **Testing:** Vitest

---

## 📁 Folder Structure
The project recently underwent a restructuring to simplify the directory layout and make it more feature-oriented and intuitive.

```text
admin-aidSprint-app/
├── public/                 # Static assets like favicons and raw SVGs
├── server/                 # Express backend API
│   ├── routes/             # Individual API endpoint handlers
│   ├── index.ts            # Main server setup and middleware
│   └── node-build.ts       # Server build configuration
├── shared/                 # Shared TypeScript interfaces/types between Client & Server
│   └── api.ts              
├── src/                    # Primary Frontend Application Directory (formerly 'client')
│   ├── components/         # Reusable React components
│   │   └── ui/             # Pre-built Radix/Shadcn UI component library
│   ├── hooks/              # Custom React hooks (e.g., use-toast, use-mobile)
│   ├── lib/                # Utility functions (e.g., tailwind merge cn() function)
│   ├── login/              # Feature: Login Module
│   │   └── login.tsx       # Main login page component
│   ├── not-found/          # Feature: 404 Error Module
│   │   └── not-found.tsx   # 404 page component
│   ├── App.tsx             # Root React component containing the Router setup
│   ├── global.css          # Tailwind directives and global design tokens
│   └── vite-env.d.ts       # Vite TypeScript definitions
├── .env                    # Environment variables
├── netlify.toml            # Netlify deployment configuration
├── tailwind.config.ts      # Tailwind styling configuration
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite frontend configuration
└── vite.config.server.ts   # Vite backend/SSR build configuration
```

---

## 🔄 Recent Changes & Restructuring

1. **`client/` to `src/` Migration:**
   - The primary frontend folder was renamed from `client` to the standard `src` directory to follow standard React conventions.
   - All configuration files (`vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `components.json`) were updated to correctly alias and resolve the new `@/` path to `./src`.

2. **Feature-based Component Organization:**
   - Removed the generic `pages/` directory.
   - Moved page components into dedicated feature directories for better scalability:
     - The main entry page (`Index.tsx`) was refactored and moved to `src/login/login.tsx`.
     - The error page was moved to `src/not-found/not-found.tsx`.
   - Updated `src/App.tsx` routing to reflect these new modular paths.

3. **TypeScript & Dependency Fixes:**
   - Resolved a TypeScript error regarding missing Node types by installing `@types/node` as a dev dependency.
   - Fixed a syntax formatting issue in `tsconfig.json` that was causing parsing failures.
   - Formatted the entire codebase using Prettier.
   - Verified that the project builds (`npm run build`) and passes type checking (`npm run typecheck`) successfully.

---

## 🚀 Getting Started & Commands

The project uses a single-port development environment (Port `8080`).

```bash
# Install dependencies
npm install

# Start development server (Client + Server Hot Reload)
npm run dev

# Run TypeScript validation
npm run typecheck

# Build for production (Builds both client SPA and server)
npm run build

# Run unit tests
npm run test
```

### Adding New Features
To maintain the new folder structure, any new pages or major features (e.g., a Dashboard) should be created in their own dedicated folder inside `src/` (e.g., `src/dashboard/dashboard.tsx`), and then imported into the `<Routes>` block within `src/App.tsx`.
