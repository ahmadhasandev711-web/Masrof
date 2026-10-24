# Sanadat (سندات)

<p align="center">
  <strong>Modern Invoicing, Cash Flow, and Financial Operating System for Freelancers, Agencies, and Small Businesses.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.2-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas_Replica_Set-green?style=for-the-badge&logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Tests-137_Passing-brightgreen?style=for-the-badge&logo=vitest" alt="Vitest" />
  <img src="https://img.shields.io/badge/PWA-Serwist-orange?style=for-the-badge&logo=pwa" alt="PWA" />
</p>

---

## 🚀 Overview

**Sanadat** is a high-performance, bilingual (Arabic & English) financial management and invoicing platform designed to give businesses, agencies, and self-employed professionals complete mastery over their cash flow, accounts, client billing, and team collaboration.

Built with Next.js 16 (App Router), React 19, and MongoDB, Sanadat strictly enforces bank-grade accounting principles, strict tenant isolation, and atomic transactional operations.

---

## ✨ Key Features

- **🧾 Full Invoicing Lifecycle:**
  - Create, customize, and issue bilingual invoices in seconds.
  - Thermal POS (80mm) and standard A4 printing.
  - Instant WhatsApp sharing with public view tokens (`/i/[token]`).
  - Partial payments, balance recalculation, and payment history tracking.

- **🔒 Integer-Only Minor Units (Zero Float Math):**
  - All monetary values are strictly stored as integers in minor units (Piastres / Cents) to eliminate floating-point rounding errors.
  - Multi-currency support with dynamic exchange rates.

- **🏢 Strict Tenant Isolation:**
  - Robust multi-tenancy where every query and mutation is bound to an authorized workspace context (`verifyWorkspaceAccess`).
  - Active team exclusivity preventing unauthorized cross-workspace membership abuse.

- **⚡ Atomic Multi-Document Transactions:**
  - Financial writes (creating transactions, transfers, payments, account balance updates) run inside MongoDB sessions/replica set transactions to ensure consistency or clean rollback.

- **👥 Team Collaboration & Workspaces:**
  - Role-Based Access Control (Owner, Member, Viewer).
  - Centralized workspace model with invitation workflow and rate-limiting.

- **🤖 Receipt OCR & AI Categorization:**
  - Scan paper receipts using on-device/server OCR (`Tesseract.js`).
  - Keyword extraction and intelligent category suggestions.

- **📊 Cash Flow & Profitability Analytics:**
  - Real-time receivables radar, overdue tracking, and project profitability margins.
  - Full data export suite (Excel, CSV, PDF) and complete workspace backups.

- **⚙️ Dynamic Admin Engine:**
  - Manage plans, pricing, limits, and feature flags directly from `/admin/plans` without redeploying code.

- **📱 Mobile App Ready (PWA & React Native):**
  - Offline-capable Progressive Web App with service worker caching via Serwist.
  - Native mobile application powered by React Native & Expo in `/mobile`.

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
|---|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) | App Router, Server Actions, Route Handlers |
| **Frontend** | [React 19](https://react.dev/) | Server Components, Suspense, Transitions |
| **Language** | [TypeScript 5.9](https://www.typescriptlang.org/) | Strict type safety across the entire stack |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Modern CSS tokens and responsive layout |
| **Database** | [MongoDB 8.x](https://www.mongodb.com/) + [Mongoose 9.x](https://mongoosejs.com/) | Replica Set with multi-document ACID transactions |
| **Authentication** | [Better-Auth](https://better-auth.com/) | Secure session management, email/password & OAuth |
| **i18n** | [next-intl](https://next-intl-docs.vercel.app/) | Bilingual Arabic (RTL) & English (LTR) parity |
| **Offline / PWA** | [Serwist](https://serwist.pages.dev/) | Service worker bundling and asset caching |
| **Validation** | [Zod v4](https://zod.dev/) | Strict schema validation for actions & APIs |
| **Testing** | [Vitest](https://vitest.dev/) | 137 unit and integration tests |

---

## 🏛️ Architecture

Sanadat uses a **Modular Monolith** architecture organized by domain features:

```
src/
├── app/                  # Next.js App Router (pages, layouts, API routes)
│   ├── (auth)/           # Authentication flows (login, register, reset-password)
│   ├── (marketing)/      # Public pages (landing, pricing, FAQ, blog, legal)
│   ├── admin/            # Platform administration (users, workspaces, plans)
│   ├── dashboard/        # Authenticated workspace dashboard
│   ├── api/              # Mobile APIs, webhooks, uploads, OCR
│   └── i/[token]/        # Public invoice view
├── features/             # Business domain logic (isolated modules)
│   ├── accounts/         # Bank & cash accounts, balance math
│   ├── admin/            # Admin operations & dynamic plan config
│   ├── auth/             # Session management & user security
│   ├── budgets/          # Monthly budget tracking & alerts
│   ├── clients/          # Client directory & account statements
│   ├── debts/            # Loans, debt tracking & installments
│   ├── invoices/         # Invoice creation, printing, payments & public shares
│   ├── projects/         # Project tracking & profitability analysis
│   ├── subscriptions/    # Freemium limits, feature gates & usage meters
│   ├── transactions/     # Incomes, expenses, transfers & ledger
│   └── workspaces/       # Tenant management, members, roles & permissions
├── components/           # Reusable UI components & layouts
├── lib/                  # Infrastructure (db, auth, money, rate-limit, email)
└── models/               # Centralized Mongoose models & schemas
```

---

## 📦 Getting Started

### Prerequisites

- **Node.js**: `22.x` or `24.x` (LTS)
- **MongoDB**: 8.x with a **Replica Set** enabled (MongoDB Atlas is recommended for ACID transactions).

### 1. Clone the repository

```bash
git clone https://github.com/ahmadhasandev711-web/Masrof.git
cd Masrof
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment configuration

Copy `.env.example` to `.env.local` and configure your credentials:

```bash
cp .env.example .env.local
```

Essential variables:

```env
# Database
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=sanadat

# Auth
BETTER_AUTH_SECRET=your-32-character-random-secret
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Admin
ADMIN_EMAILS=admin@sanadat.site

# Email (Optional for local dev - emails will log to terminal if unset)
RESEND_API_KEY=
AUTH_EMAIL_FROM="Sanadat <notifications@sanadat.site>"
```

### 4. Seed initial database data

```bash
npm run seed:categories    # Seeds default expense and income categories (idempotent)
npm run seed:posts         # (Optional) Seeds marketing blog posts
```

### 5. Start the development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the application.

---

## 🧪 Testing & Verification

Run the comprehensive test suite:

```bash
npm test
```

Run test suite in watch mode:

```bash
npm run test:watch
```

Run production build check:

```bash
npm run build
```

---

## 🚢 Deployment

Production runs at **https://sanadat.site**. Use any Node host (VPS, dedicated server, etc.) — not tied to Vercel.

1. Set environment variables from `.env.example` (required: `MONGODB_URI`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL` — both auth URLs must be `https://sanadat.site` in production).
2. Build with `npm run build` (uses `--webpack` for Serwist PWA support).
3. Start with `npm run start` behind HTTPS (Nginx/Caddy). Configure **HSTS** on the reverse proxy.
4. Optional: extra auth origins via `TRUSTED_ORIGINS` (comma-separated) for staging only.

---

## 📄 License

Proprietary — All rights reserved. © Sanadat.
