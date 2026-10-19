// The trust page and the pipeline links may only point at files the repository has and
// git tracks (like tests/how-its-built.test.ts), and the "strict CSP" tile must be true.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import TrustPage from "@/app/(site)/trust/page";
import { PIPELINE_STAGES } from "@/components/pipeline";
import { repoBranch, repoUrl, trustPage } from "@/content/site";
import { buildCsp } from "@/lib/security/csp.mjs";
import { FORBIDDEN } from "@/lib/safety/forbidden.mjs";

const root = process.cwd();

function tracked(files: string[]): Set<string> {
  const result = spawnSync("git", ["ls-files", "--", ...files], { cwd: root, encoding: "utf8" });
  expect(result.status).toBe(0);
  return new Set(result.stdout.split("\n").filter(Boolean));
}

describe("trust page controls", () => {
  const files = [...new Set(trustPage.controls.flatMap((c) => c.files))];

  it("names the seven controls, each with at least one file", () => {
    expect(trustPage.controls.map((c) => c.control)).toEqual([
      "Read-only database role",
      "Corpus allow-list",
      "Server-side citation check",
      "Output guards",
      "Rate limits",
      "Content-Security-Policy nonce",
      "Build-time secret scan",
    ]);
    for (const c of trustPage.controls) expect(c.files.length, c.control).toBeGreaterThan(0);
  });

  it("links only to files that exist and that git tracks", () => {
    for (const file of files) expect(existsSync(join(root, file)), file).toBe(true);
    const set = tracked(files);
    for (const file of files) expect(set.has(file), `${file} is not tracked by git`).toBe(true);
  });

  it("renders a GitHub link for every file", () => {
    const html = renderToStaticMarkup(<TrustPage />);
    for (const file of files) expect(html).toContain(`href="${repoUrl}/blob/${repoBranch}/${file}"`);
  });
});

describe("pipeline source links", () => {
  const files = [...new Set(PIPELINE_STAGES.map((s) => s.file))];

  it("maps each stage to the file that implements it", () => {
    expect(Object.fromEntries(PIPELINE_STAGES.map((s) => [s.key, s.file]))).toEqual({
      rate: "lib/ratelimit.ts",
      input: "lib/chat/answer.ts",
      retrieve: "lib/retrieve.ts",
      scope: "lib/chat/answer.ts",
      model: "lib/llm.ts",
      checks: "lib/chat/answer.ts",
    });
  });

  it("points only at files that exist and that git tracks", () => {
    for (const file of files) expect(existsSync(join(root, file)), file).toBe(true);
    const set = tracked(files);
    for (const file of files) expect(set.has(file), `${file} is not tracked by git`).toBe(true);
  });
});

describe("strict CSP claim", () => {
  it("is still true: the proxy sets a fresh nonce, and scripts get no unsafe-inline", () => {
    const proxy = readFileSync(join(root, "proxy.ts"), "utf8");
    expect(proxy).toContain("makeNonce()");
    expect(proxy).toContain('response.headers.set("Content-Security-Policy"');
    const csp = buildCsp("abc123abc123abc123");
    const scriptSrc = csp.split(";").map((d) => d.trim()).find((d) => d.startsWith("script-src"))!;
    expect(scriptSrc).toContain("'nonce-abc123abc123abc123'");
    expect(scriptSrc).not.toContain("unsafe-inline");
  });
});

describe("public injection questions on the trust page", () => {
  it("lists only questions from evals/injection.json that the site may print", () => {
    const set = JSON.parse(readFileSync(join(root, "evals", "injection.json"), "utf8")) as { cases: { question: string }[] };
    const html = renderToStaticMarkup(<TrustPage />).replace(/&#x27;/g, "'").replace(/&quot;/g, '"');
    const listed = [...html.matchAll(/<span class="bi-question">(.*?)<\/span>/g)].map((m) => m[1]);
    expect(listed.length).toBeGreaterThan(0);
    for (const q of listed) {
      expect(set.cases.map((c) => c.question), q).toContain(q);
      for (const rule of FORBIDDEN) expect(rule.pattern.test(q), `${q}: ${rule.why}`).toBe(false);
    }
  });
});
