# Supabase

## Cursor MCP

Supabase MCP is configured in `.cursor/mcp.json` so Cursor can list tables, apply migrations, and run SQL.

1. **Restart Cursor** (or reload the window) after adding the config.
2. **Sign in:** On first use, Cursor will open a browser to log in to Supabase and grant org access. Choose the organization that contains your project.
3. **Verify:** Settings → Cursor Settings → Tools & MCP — Supabase should show as connected (green).

To scope MCP to a single project (recommended), set the URL to:
`https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF`  
(Find `YOUR_PROJECT_REF` in Supabase Dashboard → Project Settings → General → Reference ID.)

---

## Connect the database (create tables)

The backend connects using `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`. If you see "Could not find the table 'public.users'", the **tables were never created** in your Supabase project.

**One-time setup:**

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**.
2. Click **New query**.
3. Open **`supabase/run-this-in-sql-editor.sql`** in this repo, copy the **entire** file, paste into the editor, click **Run**.
4. Restart your backend. Then `GET http://localhost:3001/api/health/db` should return `{"ok":true,"db":"connected"}`.

That file creates the `users`, `rumors`, and `votes` tables and inserts seed data.

## Env (backend)

Set in `backend/.env` (see `backend/.env.example`):

- `SUPABASE_URL` — Project URL (Settings → API).
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (Settings → API; keep secret).
