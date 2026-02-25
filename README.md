# 📦 Inventory MVP

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=for-the-badge&logo=tailwind-css)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?style=for-the-badge&logo=vercel)

**A full-stack inventory & maintenance management system built for small businesses.**  
Manage products, invoices, customer service jobs, and your team — all in one place.

[🚀 Live Demo](#) · [🐛 Report Bug](../../issues) · [✨ Request Feature](../../issues)

</div>

---

## 📋 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [User Roles](#-user-roles)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🧭 About

**Inventory MVP** is a production-ready business management platform designed for small to medium-sized businesses. It covers the full operational lifecycle — from tracking stock levels and generating invoices, to managing customer repair jobs and coordinating your team with role-based access control.

Built on the latest Next.js App Router with server actions, it offers a fast, real-time experience with no page reloads for most operations.

---

## ✨ Features

### 📦 Inventory Management
- Add, edit, and soft-delete products with SKU tracking
- Real-time low stock alerts and reorder level indicators
- Stock value calculations and movement history
- Price management restricted to superusers

### 🧾 Invoicing
- Create **Sales** and **Purchase** invoices with automatic stock adjustments
- Auto-generated invoice numbers (`INV-YYYY-#####` / `PO-YYYY-#####`)
- Line item management with real-time total calculation
- Invoice status tracking (Draft → Sent → Paid)

### 🛠️ Maintenance / Customer Service
- Log customer repair jobs with full product details (catalog or free-text)
- Three handler types: In-House, Specialist Supplier, Original Vendor
- Status workflow: `RECEIVED → IN_PROGRESS → WAITING_FOR_PARTS → REPAIRED → DELIVERED`
- Assign jobs to specific technicians
- Service fee management (superuser only)

### 👥 Customer & Supplier Management
- Full CRUD for customers and suppliers
- Linked to invoices and maintenance jobs

### 🔐 User Hierarchy & Access Control
- **Superuser** — full system access, manages users, prices, customers, suppliers
- **Normal User** — maintenance jobs, inventory (no prices), invoices
- Registration with superuser approval workflow
- Pending / Rejected account states with dedicated pages
- Password reset flow via superuser notification

### 🔔 Notification System
- Floating notification bell (bottom-right) visible to all users
- Real-time badge showing unread count
- Superusers notified of new registrations and password reset requests
- Users notified when assigned to jobs, status changes, or account approval

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Database | PostgreSQL (Supabase in production) |
| ORM | Prisma 5 |
| Auth | NextAuth.js v4 (JWT, credentials) |
| Styling | Tailwind CSS |
| Validation | Zod |
| Deployment | Vercel + Supabase |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Docker (for local PostgreSQL) or a Supabase account
- Git

### Installation

**1. Clone the repository:**
```bash
git clone https://github.com/yourusername/inventory-mvp.git
cd inventory-mvp
```

**2. Install dependencies:**
```bash
npm install
```

**3. Start a local PostgreSQL database:**
```bash
docker run -d \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=inventory \
  --name inventory-db \
  postgres:15
```

**4. Set up environment variables:**
```bash
cp .env.example .env
```
Fill in the values (see [Environment Variables](#-environment-variables)).

**5. Run database migrations and seed:**
```bash
npx prisma migrate dev
npx prisma db seed
```

**6. Start the development server:**
```bash
npm run dev -- --port 3002
```

Visit [http://localhost:3002](http://localhost:3002)

**Default superuser credentials:**
```
Username: admin
Password: admin123
```
> ⚠️ Change these immediately after first login.

---

## 🔑 Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/inventory"

# NextAuth
NEXTAUTH_URL="http://localhost:3002"
NEXTAUTH_SECRET="your-secret-key-here"
```

Generate a secure `NEXTAUTH_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🗄 Database Setup

**Run migrations:**
```bash
npx prisma migrate dev
```

**Seed the superuser:**
```bash
npx prisma db seed
```

**View data in Prisma Studio:**
```bash
npx prisma studio
```

**Reset the database (dev only):**
```bash
npx prisma migrate reset
```

---

## 👤 User Roles

| Permission | Normal User | Superuser |
|---|:---:|:---:|
| View dashboard | ✅ | ✅ |
| Manage maintenance jobs | ✅ | ✅ |
| Add / edit products | ✅ | ✅ |
| Set product prices | ❌ | ✅ |
| Create invoices | ✅ | ✅ |
| Manage customers | ❌ | ✅ |
| Manage suppliers | ❌ | ✅ |
| Manage users | ❌ | ✅ |
| Assign maintenance jobs | ❌ | ✅ |
| Approve registrations | ❌ | ✅ |

### Registration Flow

```
User registers → PENDING status → Superuser notified
      ↓
Superuser approves (assigns role) → User becomes ACTIVE
      ↓
User can now log in
```

---

## 📁 Project Structure

```
inventory-mvp/
├── app/
│   ├── (auth)/                  # Auth pages (login, register, forgot password)
│   ├── api/                     # API routes (NextAuth, users)
│   ├── actions/                 # Server actions
│   │   ├── dashboard.ts
│   │   ├── products.ts
│   │   ├── invoices.ts
│   │   ├── maintenance.ts
│   │   ├── customers.ts
│   │   ├── suppliers.ts
│   │   ├── users.ts
│   │   └── notifications.ts
│   ├── components/              # Shared client components
│   │   └── NotificationBell.tsx
│   ├── dashboard/
│   │   ├── layout.tsx           # Sidebar + nav (client)
│   │   └── (server)/            # All dashboard pages (force-dynamic)
│   │       ├── layout.tsx       # Single dynamic export for all pages
│   │       ├── page.tsx         # Dashboard home
│   │       ├── products/
│   │       ├── invoices/
│   │       ├── maintenance/
│   │       ├── customers/
│   │       ├── suppliers/
│   │       └── users/
│   ├── pending/                 # Pending approval page
│   └── rejected/                # Rejected account page
├── lib/
│   ├── auth.ts                  # NextAuth config
│   ├── prisma.ts                # Prisma client singleton
│   ├── session.ts               # Auth helpers (requireAuth, requireSuperuser)
│   └── schemas/                 # Zod validation schemas
├── prisma/
│   ├── schema.prisma            # Database schema
│   ├── migrations/              # Migration history
│   └── seed.ts                  # Database seeder
└── public/
```

---

## 🌐 Deployment

### Deploy to Vercel + Supabase

**1. Create a Supabase project** at [supabase.com](https://supabase.com)  
Copy the database connection string from **Settings → Database → URI**.

**2. Push schema to production:**
```bash
$env:DATABASE_URL="your-supabase-url"
npx prisma migrate deploy
npx prisma db seed
```

**3. Push to GitHub:**
```bash
git add .
git commit -m "initial commit"
git push origin main
```

**4. Deploy on Vercel:**
- Import your GitHub repository at [vercel.com](https://vercel.com)
- Add these environment variables:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Supabase connection string |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | Generated secret string |

**5. Redeploy** after setting environment variables.

> **Note:** The build command is set to `prisma generate && next build` to ensure the Prisma client is always generated fresh on Vercel.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

Please make sure your code follows the existing patterns (server actions, Zod validation, Prisma transactions).

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  Built with ❤️ using Next.js, Prisma, and Tailwind CSS
</div>
