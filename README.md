# Document Verification (DVR)

A web application for reviewing and verifying shipping documents against system records. Built for GC (PTT Global Chemical) internal operations.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 19 + TypeScript |
| Build Tool | Vite 7 |
| Styling | Tailwind CSS v3 + OutSystems UI v2 design tokens |
| State | React `useState` / `useLocalStorage` hook |
| Export | `xlsx` (Excel export) |

## Getting Started

> **Requires Node.js 20.19+ or 22.12+.** If you use `nvm`, run `nvm use 22` first.

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
# → http://localhost:5173/

# Production build
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── assets/           Static assets (logo, images)
├── components/       All React page & UI components
│   ├── Navbar.tsx
│   ├── LoginPage.tsx
│   ├── TaskTable.tsx
│   ├── TaskFilterBar.tsx
│   ├── CiOverviewPage.tsx
│   ├── ComparisonTable.tsx
│   ├── StepMap.tsx       ← OS UI Wizard stepper
│   ├── StatusBadge.tsx
│   ├── ActionBar.tsx
│   ├── SettingsPage.tsx
│   └── ...
├── data/             Mock data & types (mockData.ts)
├── hooks/            Custom hooks (useLocalStorage)
├── services/         LLM comparison service
├── utils/            Excel export, comparison helpers
├── App.tsx           Root component & routing (hash-based)
└── index.css         Global styles & OS UI design tokens
```

## Design System

This app uses **OutSystems UI v2** design tokens. Key CSS variables defined in `src/index.css`:

| Token | Value | Usage |
|-------|-------|-------|
| `--os-primary` | `#1068eb` | Buttons, links, active states |
| `--os-primary-hover` | `#295fd6` | Button hover |
| `--os-body-bg` | `#f3f6f8` | Page background |
| `--os-border` | `#dee2e6` | Card & input borders |
| `--os-text-primary` | `#272b30` | Headings, primary text |
| `--os-text-secondary` | `#4f575e` | Labels, secondary text |
| `--os-text-muted` | `#6a7178` | Hints, metadata |
| `--os-success` | `#29823b` | Approved / All Matches |
| `--os-warning` | `#e9a100` | Needs Attention |
| `--os-error` | `#dc2020` | Rejected |
| `--os-info` | `#017aad` | Informational |

## Agent Skills

This repository includes agent skill files in `.agents/skills/` to assist AI coding assistants. Each skill provides guidelines, patterns, and references for its domain:

| Skill | Description |
|-------|-------------|
| `frontend-design` | Production-grade UI design guidelines — typography, color, motion, layout |
| `accessibility` | WCAG 2.2 compliance — keyboard nav, ARIA, contrast, screen reader support |
| `vite` | Vite 8/Rolldown config, plugin API, SSR, build optimisation |
| `vercel-react-best-practices` | React performance patterns — eliminating waterfalls, bundle size, Suspense |
| `vercel-composition-patterns` | React composition — compound components, state lifting, context patterns |
| `nodejs-backend-patterns` | Node.js backend patterns for API routes and services |
| `typescript-advanced-types` | Advanced TypeScript — generics, conditional types, utility types |
| `seo` | SEO best practices for web apps |

When asking an AI assistant to work on a specific area, reference the relevant skill file for context-aware suggestions.

## Branches

| Branch | Purpose |
|--------|---------|
| `master` | Stable base |
| `marisa/ui-updates` | Marisa's UI updates |
| `noppanan.p/updates` | UX improvements — OS UI consistency, responsive design |
