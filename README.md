# FishCatch Frontend

Web client for **FishCatch** — Fishing Fleet Management, Crew Cash Advances (*Kasbon*), and Trip Bookkeeping.

## Tech Stack
- **React 18** & **Vite 6**
- **Tailwind CSS v4** & **React Router v7**
- **Lucide Icons** & **Google Identity Services**

## Core Features
- **Auth & 1-Click Demo:** Email/Password, Google Sign-In, and pre-seeded ephemeral Demo Mode.
- **Trips & Accounting:** Trip financial summary cards (Income, Expenses, Net Profit), sales logs, and crew wage kasbon deduction calculator.
- **Vessels & Crew (ABK):** Master data management with active crew debt indicators.
- **Cash Advances (Kasbon):** Loan and repayment ledger with instant debt filtering.

## Quick Start

1. Create `.env` in the project root:
   ```env
   VITE_API_BASE_URL=http://localhost:8080/api
   VITE_GOOGLE_CLIENT_ID=<your-google-client-id>.apps.googleusercontent.com
   ```
2. Install dependencies and start dev server:
   ```bash
   npm install
   npm run dev
   ```
   App runs at `http://localhost:5173`.
