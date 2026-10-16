// The post-build scan must catch markers, ruled-out wording and example traces in built files.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  findForbidden,
  findSecrets,
  isServerCode,
  missingRequiredSecrets,
  publicEnvNames,
  secretValues,
} from "@/scripts/check-built-output.mjs";
import { GUARD_SENTINEL } from "@/lib/safety/forbidden.mjs";

let dir = "";

function fakeBuild(files: Record<string, string>): string {
  dir = mkdtempSync(join(tmpdir(), "built-output-"));
  for (const [path, body] of Object.entries(files)) {
    const full = join(dir, path);
    mkdirSync(join(full, ".."), { recursive: true });
    writeFileSync(full, body);
  }
  return dir;
}

afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  dir = "";
});

describe("check-built-output", () => {
  it("passes clean output", () => {
    expect(findForbidden(fakeBuild({ "server/app/index.html": "<h1>Hello</h1>" }))).toEqual([]);
  });

  it.each([
    ["server/app/index.html", "<p>[CONFIRM: approve this]</p>"],
    ["server/app/index.rsc", "[INTERVIEW-ONLY] detail"],
    ["server/app/index.html", "with 5+ years of experience"],
    ["server/app/index.html", "with 5<!-- -->+ years of experience"],
    ["static/chunks/app.js", '"see docs/private/notes"'],
    ["static/chunks/app.js", '"see docs\\\\private\\\\notes"'],
    ["server/app/x.html", "crew  scheduling system"],
    ["static/css/app.css", '.x::after{content:"[CONFIRM"}'],
    ["static/chunks/client.js", '"with 5+ years"'],
    ["server/chunks/route.js", '"see docs/private/x"'],
    ["server/app/api/chat/route.js.nft.json", '{"files":["../../docs/private/x.md"]}'],
  ])("fails on %s containing %s", (path, body) => {
    expect(findForbidden(fakeBuild({ [path]: body }))).toHaveLength(1);
  });

  it("lets the bundled guard (marked by its sentinel) contain the strings it blocks", () => {
    const build = fakeBuild({
      "server/chunks/route.js": `const why = "unapproved [CONFIRM] text (${GUARD_SENTINEL}); \\"5+ years\\" is not approved; [PUBLIC-GENERAL]"`,
    });
    expect(findForbidden(build)).toEqual([]);
  });

  it("applies every rule to other server code, which could render text at request time", () => {
    const build = fakeBuild({ "server/chunks/page.js": '"[CONFIRM: rendered at request time]"' });
    expect(findForbidden(build)).toHaveLength(1);
  });

  it("still catches example text and private terms in the guard bundle", () => {
    const build = fakeBuild({ "server/chunks/route.js": `"${GUARD_SENTINEL}" "Alex Sample" and "some private word"` });
    expect(findForbidden(build, { extraTerms: ["private word"] })).toHaveLength(2);
  });

  it("finds secret values anywhere in the build and reports only the variable name", () => {
    const build = fakeBuild({
      "static/chunks/app.js": 'const k="sk-live-abcdefghijklmnop";',
      "server/chunks/route.js": 'const db="postgresql://chat_reader:Sup3rS3cretPassw0rd@host/neondb";',
      "server/app/index.html": "<p>nothing here</p>",
    });
    const secrets = secretValues({
      OPENAI_API_KEY: "sk-live-abcdefghijklmnop",
      DATABASE_URL_READONLY: "postgresql://chat_reader:Sup3rS3cretPassw0rd@other-host/neondb",
      UPSTASH_REDIS_REST_TOKEN: "short",
    });
    const hits = findSecrets(build, secrets).sort();
    expect(hits).toEqual([
      "server/chunks/route.js: value of DATABASE_URL_READONLY (password)",
      "static/chunks/app.js: value of OPENAI_API_KEY",
    ]);
    expect(hits.join(" ")).not.toContain("Sup3rS3cret");
    expect(hits.join(" ")).not.toContain("sk-live");
  });

  it("catches URL-encoded copies and files outside server/ and static/, but skips Next's cache", () => {
    const build = fakeBuild({
      "required-server-files.json": '{"x":"p%40ss%2Fword-123456"}',
      "server/chunks/x.js.map": '"sk-live-abcdefghijklmnop"',
      "cache/fetch/old": "sk-live-abcdefghijklmnop",
    });
    const hits = findSecrets(build, [
      { name: "DATABASE_URL (password)", value: "p@ss/word-123456" },
      { name: "OPENAI_API_KEY", value: "sk-live-abcdefghijklmnop" },
    ]).sort();
    expect(hits).toEqual(["required-server-files.json: value of DATABASE_URL (password)", "server/chunks/x.js.map: value of OPENAI_API_KEY"]);
  });

  it("requires the key secrets on Vercel and rejects NEXT_PUBLIC_ variables", () => {
    expect(missingRequiredSecrets({})).toEqual([]);
    expect(missingRequiredSecrets({ VERCEL_ENV: "production", OPENAI_API_KEY: "x" })).toEqual(["DATABASE_URL_READONLY", "UPSTASH_REDIS_REST_TOKEN"]);
    expect(publicEnvNames({ NEXT_PUBLIC_API_KEY: "x", OPENAI_API_KEY: "y" })).toEqual(["NEXT_PUBLIC_API_KEY"]);
  });

  it("reports nothing when no secrets are available", () => {
    expect(findSecrets(fakeBuild({ "static/a.js": "x" }), secretValues({}))).toEqual([]);
  });

  it("treats server-rendered HTML and RSC as visitor-facing", () => {
    expect(isServerCode("server/app/index.html")).toBe(false);
    expect(isServerCode("server/app/index.rsc")).toBe(false);
    expect(isServerCode("server/chunks/x.js")).toBe(true);
  });

  it("fails on private terms passed in from the git-ignored list", () => {
    const build = fakeBuild({ "server/app/index.html": "<p>Some Private Word here</p>" });
    expect(findForbidden(build)).toEqual([]);
    expect(findForbidden(build, { extraTerms: ["private word"] })).toHaveLength(1);
  });

  it("fails on example routes or links unless the example is allowed", () => {
    const build = fakeBuild({
      "server/app/example/index.html": "<h1>Alex Sample</h1>",
      "server/app/index.html": '<a href="/example">Example</a>',
    });
    expect(findForbidden(build).length).toBeGreaterThanOrEqual(3);
    expect(findForbidden(build, { allowExample: true })).toEqual([]);
  });
});
