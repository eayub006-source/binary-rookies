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

## Running migrations

1. Open your [Supabase project](https://supabase.com/dashboard) → **SQL Editor**.
2. Copy the contents of `migrations/001_initial_schema.sql` and run it.

Or with Supabase CLI (if linked):

```bash
supabase db push
```

## Env (backend)

Set in `backend/.env` (see `backend/.env.example`):

- `SUPABASE_URL` — Project URL (Settings → API).
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (Settings → API; keep secret).
