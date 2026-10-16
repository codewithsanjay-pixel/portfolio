// Database access. Two separate connections (SPEC.md, docs/DB.md):
// - owner (DATABASE_URL): used only by the ingest script, to create and write chunks
// - read-only (DATABASE_URL_READONLY): the only access the chat route has
// Queries always use $1, $2 placeholders; user text is never spliced into SQL.
// Errors never include the connection string or the database's response body.
import { neon } from "@neondatabase/serverless";
import { requireEnv, type Env } from "./env";

export type Row = Record<string, unknown>;
export type Statement = { text: string; params?: unknown[] };

export type Db = {
  query(text: string, params?: unknown[]): Promise<Row[]>;
  // Runs all statements in one transaction: all succeed or none do.
  transaction(statements: readonly Statement[]): Promise<void>;
};

// Validates before the driver sees the URL: the driver's own parse error quotes the full string.
function checkedUrl(name: string, env: Env): string {
  const raw = requireEnv(name, env);
  let protocol = "";
  try {
    protocol = new URL(raw).protocol;
  } catch {
    // fall through
  }
  if (protocol !== "postgres:" && protocol !== "postgresql:") {
    throw new Error(`${name} is not a valid postgres:// connection string. Paste only the URL, without quotes or "psql".`);
  }
  return raw;
}

// Keeps only the Postgres error code; the original stays as `cause` for local debugging.
function safeError(err: unknown): Error {
  const code = typeof err === "object" && err && "code" in err ? String((err as { code: unknown }).code) : "unknown";
  return new Error(`Database query failed (code ${code}).`, { cause: err });
}

function connect(url: string): Db {
  const sql = neon(url);
  return {
    async query(text, params = []) {
      try {
        return (await sql.query(text, params)) as Row[];
      } catch (err) {
        throw safeError(err);
      }
    },
    async transaction(statements) {
      try {
        await sql.transaction(statements.map((s) => sql.query(s.text, s.params ?? [])));
      } catch (err) {
        throw safeError(err);
      }
    },
  };
}

export function ownerDb(env: Env = process.env): Db {
  return connect(checkedUrl("DATABASE_URL", env));
}

export function readonlyDb(env: Env = process.env): Db {
  return connect(checkedUrl("DATABASE_URL_READONLY", env));
}
