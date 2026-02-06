# Supabase

## Cursor MCP

Supabase MCP is configured in `.cursor/mcp.json` so Cursor can list tables and run SQL.

1. **Restart Cursor** (or reload the window) after adding the config.
2. **Sign in:** On first use, Cursor will open a browser to log in to Supabase. Choose the organization that contains your project.
3. **Scope to one project:** Set the URL to `https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF` (Dashboard → Project Settings → General → Reference ID).

---

## Database schema and seed

Schema and data are managed by **Prisma** in the backend, not by SQL in this folder.

- **Schema:** `backend/prisma/schema.prisma`
- **Seed:** `backend/prisma/seed.js`

From the repo root:

```bash
cd backend
npx prisma generate
npx prisma db push
npm run db:seed
```

Connection strings: set `DATABASE_URL` and `DIRECT_URL` in `backend/.env` (from Supabase Dashboard → Connect → ORMs → Prisma; use your **database password**). See [docs/PRISMA_SUPABASE.md](../docs/PRISMA_SUPABASE.md).
