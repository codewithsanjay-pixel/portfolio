// npm run db:check: proves the chat's database role can read chunks and cannot
// change anything (docs/DB.md). Checks the real grants, not just session defaults.
// Prints results only, never connection strings.
import { readonlyDb, type Db } from "@/lib/db";
import { loadLocalEnv } from "./load-env";

// Each query must return a single row { ok: true }.
const PRIVILEGE_CHECKS: { label: string; sql: string }[] = [
  {
    label: "no write privileges on chunks",
    sql: "SELECT NOT has_table_privilege('chunks', 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') AS ok",
  },
  { label: "no CREATE on schema public", sql: "SELECT NOT has_schema_privilege('public', 'CREATE') AS ok" },
  {
    label: "not superuser, cannot create roles or databases, cannot bypass row security",
    sql: "SELECT NOT (rolsuper OR rolcreaterole OR rolcreatedb OR rolbypassrls) AS ok FROM pg_roles WHERE rolname = current_user",
  },
  {
    label: "not a member of neon_superuser",
    sql:
      "SELECT NOT EXISTS (SELECT 1 FROM pg_roles r WHERE r.rolname = 'neon_superuser' " +
      "AND pg_has_role(current_user, r.oid, 'MEMBER')) AS ok",
  },
  {
    label: "can SELECT no table except chunks",
    sql:
      "SELECT NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace " +
      "WHERE c.relkind IN ('r','p','v','m','f') AND n.nspname NOT IN ('pg_catalog','information_schema') " +
      "AND c.relname <> 'chunks' AND has_table_privilege(c.oid, 'SELECT')) AS ok",
  },
  { label: "statement timeout is set", sql: "SELECT current_setting('statement_timeout') <> '0' AS ok" },
];

async function expectDenied(db: Db, label: string, sql: string): Promise<boolean> {
  try {
    await db.query(sql);
    console.error(`FAIL  ${label}: the read-only role was allowed to do this.`);
    return false;
  } catch (err) {
    // lib/db.ts keeps only the Postgres error code. 42501 = insufficient privilege, 25006 = read-only transaction.
    const message = err instanceof Error ? err.message : "";
    if (/code (42501|25006)\)/.test(message)) {
      console.log(`ok    ${label}: denied`);
      return true;
    }
    console.error(`FAIL  ${label}: failed for another reason (${message}), so this proves nothing.`);
    return false;
  }
}

async function main() {
  loadLocalEnv();
  const db = readonlyDb();

  const [{ user }] = (await db.query("SELECT current_user AS user")) as { user: string }[];
  const [{ count }] = (await db.query("SELECT count(*)::int AS count FROM chunks")) as { count: number }[];
  console.log(`ok    connected as ${user}; can read ${count} chunks`);

  let passed = count > 0;
  if (count === 0) console.error("FAIL  no chunks found. Run npm run ingest first.");

  for (const check of PRIVILEGE_CHECKS) {
    const [row] = (await db.query(check.sql)) as { ok: boolean }[];
    if (row?.ok === true) console.log(`ok    ${check.label}`);
    else {
      console.error(`FAIL  ${check.label}`);
      passed = false;
    }
  }

  const probes: [string, string][] = [
    ["insert", "INSERT INTO chunks (id, source, context, text, content_hash, model, embedding) SELECT 'x','x','x','x','x','x', embedding FROM chunks LIMIT 1"],
    ["update", "UPDATE chunks SET text = text WHERE false"],
    ["delete", "DELETE FROM chunks WHERE false"],
    ["truncate", "TRUNCATE chunks"],
    ["create table", "CREATE TABLE db_check_probe (id int)"],
  ];
  for (const [label, sql] of probes) passed = (await expectDenied(db, label, sql)) && passed;

  if (!passed) {
    console.error("Read-only role check FAILED. Fix the role grants in docs/DB.md.");
    process.exit(1);
  }
  console.log("Read-only role check passed.");
}

main().catch((err: unknown) => {
  console.error(`db:check failed: ${err instanceof Error ? err.message : "unknown error"}`);
  process.exit(1);
});
