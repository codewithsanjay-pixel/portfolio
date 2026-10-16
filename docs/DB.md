# Database: Postgres with pgvector on Neon

## Two roles
| Role | Used by | Can do | Env var |
|---|---|---|---|
| Owner (Neon's default, e.g. `neondb_owner`) | `npm run ingest` only, on my machine | create the table, write chunks | `DATABASE_URL` |
| `chat_reader` (created with SQL below) | the chat route | read the `chunks` table, nothing else | `DATABASE_URL_READONLY` |

Access control lives here, below the prompt. Even if the model were tricked, the chat's connection cannot write, delete or read anything but `chunks`.

**Why the reader role is created with SQL:** Neon's docs say roles made in the Neon Console, CLI or API are "granted membership in the `neon_superuser` role", which has broad privileges. Roles made with SQL `CREATE ROLE` get no such membership: "You must grant these roles the privileges you want them to have."

## Table
`db/schema.sql`, applied by `npm run ingest` (safe to repeat):
- `CREATE EXTENSION IF NOT EXISTS vector`
- the `chunks` table (id, source, context, text, content_hash, model, `embedding vector(1536)`)
- an HNSW index with cosine distance

## Order of setup
1. Put the owner connection string in `.env.local` as `DATABASE_URL`.
2. Run `npm run ingest`. This creates the table and stores the chunks.
3. Create the read-only role with the SQL below, in the Neon SQL Editor.
4. Put its connection string in `.env.local` as `DATABASE_URL_READONLY`.
5. Run `npm run db:check`. It must print "Read-only role check passed".

## Read-only role SQL
Run in the Neon SQL Editor, on the same database as the table (`neondb` unless you renamed it). Replace `PASTE_PASSWORD_HERE` in the editor itself, never in chat or a file in the repo.

Neon requires a password with at least 60 bits of entropy. Generate one in your own terminal; letters and digits only, so it needs no escaping in a connection string:

```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
```

```sql
CREATE ROLE chat_reader WITH LOGIN PASSWORD 'PASTE_PASSWORD_HERE';

GRANT CONNECT ON DATABASE neondb TO chat_reader;
GRANT USAGE ON SCHEMA public TO chat_reader;
GRANT SELECT ON TABLE chunks TO chat_reader;

-- Belt and braces: every session of this role is read-only.
-- (A session could turn this off, so the grants above are the real boundary.)
ALTER ROLE chat_reader SET default_transaction_read_only = on;

-- A slow or stuck query cannot hold a chat request open.
ALTER ROLE chat_reader SET statement_timeout = '5s';

-- Nobody but the owner may create objects in public (already the default on Postgres 15+),
-- and nobody gets temporary tables by default.
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE TEMPORARY ON DATABASE neondb FROM PUBLIC;
```

If you already created `chat_reader` with the earlier version of this SQL, run just these two lines in the SQL Editor:

```sql
ALTER ROLE chat_reader SET statement_timeout = '5s';
REVOKE TEMPORARY ON DATABASE neondb FROM PUBLIC;
```

**SQL Editor history:** the editor may keep the `CREATE ROLE ... PASSWORD` statement in its query history. If it does, delete that history entry. If you cannot delete it, change the password with `ALTER ROLE chat_reader WITH PASSWORD '...'`, then update `.env.local` (and later Vercel), and delete that history entry too.

The reader's connection string is the owner's with the user and password swapped:
`postgresql://chat_reader:<password>@<same host>/neondb?sslmode=require`

## Checks
- `npm run db:check`: connects as `chat_reader` and reads the chunk count. It then asks Postgres what the role may do:
  - no write privilege on `chunks`, and no CREATE on `public`
  - not a superuser, no role or database creation, no row-security bypass
  - not a member of `neon_superuser`
  - SELECT on no table except `chunks`
  - a statement timeout is set

  Finally, it confirms insert, update, delete, truncate and create table are each refused with a permission (42501) or read-only (25006) error.
- `npm run ingest`: prints how many chunks were embedded, unchanged and removed. It fails if the row count does not match the corpus. Rows for chunks no longer in the resume, including lines later held back for confirmation, are deleted.
- Retrieval (`lib/retrieve.ts`) also drops any row whose id is not in the current corpus, or whose stored text hash no longer matches the current resume text, in case the table is stale.
- Rows removed from the corpus are deleted before anything is embedded, so a failed embedding call cannot leave a held-back line in the table.
