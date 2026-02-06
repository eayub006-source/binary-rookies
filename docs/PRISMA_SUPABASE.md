# Connect to Supabase with Prisma

The backend uses **Prisma** to talk to your Supabase **PostgreSQL** database. You need the **database connection string**, not the Supabase API keys (publishable/secret).

## 1. Get the connection strings

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **Connect** (or **Project Settings** → **Database**).
3. Open the **ORMs** tab and select **Prisma**.
4. You’ll see:
   - **DATABASE_URL** — connection pooling (port 6543, `?pgbouncer=true`).
   - **DIRECT_URL** — direct connection (port 5432, for migrations).

5. Replace **`[YOUR-PASSWORD]`** in both URLs with your **database password**:
   - **Project Settings** → **Database** → **Database password** (or reset it if you don’t know it).
   - This is **not** the API “Secret key” (sb_secret_...). It’s the Postgres user password.

## 2. Set env in the backend

In `backend/.env`:

```env
DATABASE_URL="postgresql://postgres.XXXXX:[YOUR-DATABASE-PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.XXXXX:[YOUR-DATABASE-PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

Use the same URLs Supabase shows for your project (region/host may differ).

## 3. Create tables and seed

From the `backend` folder:

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run db:seed
```

- **`prisma db push`** — creates or updates tables in Supabase to match `prisma/schema.prisma`.
- **`npm run db:seed`** — inserts sample users, rumors, and votes.

## 4. Check connection

```bash
curl -s http://localhost:3001/api/health/db
```

You should get: `{"ok":true,"db":"connected"}`.

## Summary

| What              | Where to get it |
|-------------------|------------------|
| DATABASE_URL      | Connect → ORMs → Prisma (with DB password) |
| DIRECT_URL        | Same page (with DB password) |
| Database password | Project Settings → Database (not the API secret key) |

Publishable and secret **API keys** are for the Supabase JS client (e.g. frontend). Prisma uses only the **Postgres connection strings** above.
