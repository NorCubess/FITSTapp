# FITSTapp — FITSTOP Admin Dashboard & POS System
## Build Order Checklist

**Stack:** Next.js · TypeScript · Supabase · Tailwind CSS · Vercel · GitHub

---

## Step 1 — Set up your project

- [x] **1a.** Run `npx create-next-app@latest fitstop` in your terminal
- [x] **1b.** When prompted, select: TypeScript = Yes, Tailwind CSS = Yes, ESLint = Yes, App Router = Yes, src/ directory = Yes, import alias = Yes (@/*)
- [x] **1c.** Navigate into the project: `cd fitstop`
- [x] **1d.** Run `npm run dev` and confirm the app loads at localhost:3000
- [x] **1e.** Install Supabase JS SDK: `npm install @supabase/supabase-js`
- [x] **1f.** Install Supabase Auth helpers for Next.js: `npm install @supabase/ssr`
- [x] **1g.** Confirm Tailwind is working by adding a test class to `src/app/page.tsx` and checking the browser
- [x] **1h.** Push the project to a new GitHub repository
- [x] **1i.** Connect the GitHub repo to Vercel and trigger a first deployment
- [x] **1j.** Confirm the live Vercel URL loads correctly

---

## Step 2 — Design your Supabase database schema

- [x] **2a.** Log in to Supabase and create a new project named `fitstop`
(project name: FITSTOP || password: abYADyAqCZjoPofP)

- [x] **2b.** Create a `members` table with columns: id (uuid, PK), full_name (text), email (text), phone (text), created_at (timestamptz)
- [x] **2c.** Create a `memberships` table with columns: id (uuid, PK), member_id (uuid, FK → members.id), type (text), start_date (date), end_date (date), sessions_remaining (int), status (text: active/expired)
- [x] **2d.** Create an `attendance` table with columns: id (uuid, PK), member_id (uuid, FK → members.id), scanned_at (timestamptz), method (text: qr/manual)
- [x] **2e.** Create a `products` table with columns: id (uuid, PK), name (text), price (numeric), stock_quantity (int), category (text)
- [x] **2f.** Create a `transactions` table with columns: id (uuid, PK), type (text: membership/product), items (jsonb), total_amount (numeric), payment_method (text), created_at (timestamptz)
- [x] **2g.** Enable Row Level Security (RLS) on all tables in Supabase
- [x] **2h.** Create a `.env.local` file in the project root with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project settings
- [ ] **2i.** Create `src/lib/supabase/client.ts` for browser-side Supabase client using `createBrowserClient` from `@supabase/ssr`
- [ ] **2j.** Create `src/lib/supabase/server.ts` for server-side Supabase client using `createServerClient` from `@supabase/ssr`
- [ ] **2k.** Create `src/types/database.ts` to define TypeScript interfaces for all your tables (Member, Membership, Attendance, Product, Transaction)
- [ ] **2l.** Add `.env.local` to `.gitignore` so keys are not pushed to GitHub

---

## Step 3 — Build admin login and route protection

- [ ] **3a.** Enable Email/Password auth in Supabase dashboard under Authentication > Providers
- [ ] **3b.** Manually create the first admin user in Supabase Authentication > Users
- [ ] **3c.** Create `src/app/login/page.tsx` with a login form component using React state for email and password fields
- [ ] **3d.** Wire the login form to `supabase.auth.signInWithPassword()` using the browser client
- [ ] **3e.** Create a Next.js middleware file at `src/middleware.ts` to protect all `/dashboard` routes — redirect unauthenticated users to `/login`
- [ ] **3f.** Set up the app folder structure: `src/app/login/`, `src/app/dashboard/`, `src/app/dashboard/pos/`, `src/app/dashboard/inventory/`, `src/app/dashboard/members/`, `src/app/dashboard/scanner/`
- [ ] **3g.** Create `src/app/dashboard/layout.tsx` as the shared layout for all dashboard pages (sidebar, nav)
- [ ] **3h.** Add a logout button in the dashboard layout that calls `supabase.auth.signOut()` and redirects to `/login`
- [ ] **3i.** Test: confirm unauthenticated users are redirected to `/login` when accessing any `/dashboard` route

---

## Step 4 — Build the QR scanner dashboard

- [ ] **4a.** Install the QR scanner library: `npm install html5-qrcode`
- [ ] **4b.** Create `src/app/dashboard/scanner/page.tsx` as a Client Component (add `'use client'` at the top)
- [ ] **4c.** Mount the `Html5QrcodeScanner` inside a `useEffect` hook targeting a div with a fixed id
- [ ] **4d.** On successful scan, extract the member UUID from the QR string and call a handler function
- [ ] **4e.** Query Supabase `members` and `memberships` tables using the scanned UUID — type the response with your `Member` and `Membership` interfaces
- [ ] **4f.** Display the member's name, membership type, and expiry/sessions remaining in a result card
- [ ] **4g.** Show a clear visual indicator: green (Tailwind `bg-green-100`) for valid, red (`bg-red-100`) for expired
- [ ] **4h.** On valid scan, insert a row into the `attendance` table with member_id and scanned_at timestamp
- [ ] **4i.** If membership type is session-based, decrement `sessions_remaining` in the `memberships` table
- [ ] **4j.** Handle edge cases: unknown QR code, expired membership, zero sessions remaining — show appropriate error messages
- [ ] **4k.** Test end-to-end: scan a manually generated QR and confirm attendance is recorded in Supabase

---

## Step 5 — Build the POS and inventory

- [ ] **5a.** Create `src/app/dashboard/pos/page.tsx` as a Client Component with a two-column layout: product grid (left) and cart panel (right)
- [ ] **5b.** Fetch all products from Supabase `products` table using `useEffect` on mount — type results with your `Product` interface
- [ ] **5c.** Define a `CartItem` TypeScript type (product + quantity) and manage cart state with `useState`
- [ ] **5d.** Render product cards with an Add to Cart button; display cart items with quantity controls and a running total
- [ ] **5e.** Add a checkout button that inserts a row into the `transactions` table with cart contents and total
- [ ] **5f.** On checkout, decrement `stock_quantity` for each sold product in the `products` table
- [ ] **5g.** Create `src/app/dashboard/inventory/page.tsx` — fetch and list all products with current stock levels
- [ ] **5h.** Add a form in the inventory page to create new products and update existing stock quantities
- [ ] **5i.** Highlight low-stock products (less than 5 units) using Tailwind amber/red classes
- [ ] **5j.** Test: complete a mock sale and confirm stock decrements and the transaction row is recorded in Supabase

---

## Step 6 — Add membership management

- [ ] **6a.** Install QR code generator: `npm install qrcode.react` and its types `npm install -D @types/qrcode`
- [ ] **6b.** Create `src/app/dashboard/members/page.tsx` listing all members with search and filter by membership status
- [ ] **6c.** Add a New Member form (name, email, phone) that inserts a typed `Member` object into the `members` table
- [ ] **6d.** After creating a member, automatically insert a corresponding row into the `memberships` table
- [ ] **6e.** Create `src/app/dashboard/members/[id]/page.tsx` as a member detail page showing their QR code rendered with `<QRCodeSVG value={member.id} />`
- [ ] **6f.** Add a Renew Membership button that updates `end_date` or `sessions_remaining` in the `memberships` table
- [ ] **6g.** Add membership as a sellable item in the POS — on purchase, auto-create or renew the membership record
- [ ] **6h.** Build a printable receipt view at `src/app/dashboard/pos/receipt/[id]/page.tsx` showing transaction summary and the member's QR code
- [ ] **6i.** For short-term / walk-in clients, generate a one-time QR from the POS receipt with a session count or expiry date encoded in the value
- [ ] **6j.** Test full flow: create member → sell membership → scan QR → confirm attendance recorded and sessions decremented