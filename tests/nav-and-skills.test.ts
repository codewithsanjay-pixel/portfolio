import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { nav } from "@/content/site";
import { exampleLinkEnabled, withExampleLink } from "@/lib/nav";
import { ALL_GROUPS, filterSkillGroups } from "@/lib/skills";

describe("example nav link", () => {
  const links = [{ href: "#focus", label: "Focus" }];

  it("is off unless SHOW_EXAMPLE is exactly true", () => {
    expect(exampleLinkEnabled({})).toBe(false);
    expect(exampleLinkEnabled({ SHOW_EXAMPLE: "1" })).toBe(false);
    expect(exampleLinkEnabled({ SHOW_EXAMPLE: "TRUE" })).toBe(false);
    expect(exampleLinkEnabled({ SHOW_EXAMPLE: "true" })).toBe(true);
  });

  it("is always off on Vercel or CI", () => {
    expect(exampleLinkEnabled({ SHOW_EXAMPLE: "true", VERCEL: "1" })).toBe(false);
    expect(exampleLinkEnabled({ SHOW_EXAMPLE: "true", VERCEL_ENV: "production" })).toBe(false);
    expect(exampleLinkEnabled({ SHOW_EXAMPLE: "true", CI: "true" })).toBe(false);
  });

  it("adds the link only when enabled", () => {
    expect(withExampleLink(links, false)).toEqual(links);
    expect(withExampleLink(links, true).map((l) => l.href)).toEqual(["#focus", "/example"]);
  });

  it("does not change the original list", () => {
    withExampleLink(links, true);
    expect(links).toHaveLength(1);
  });
});

describe("header nav", () => {
  it("ends with How it's built, Trust and MCP, with no duplicate targets", () => {
    expect(nav.slice(-3)).toEqual([
      { href: "/how-its-built", label: "How it's built" },
      { href: "/trust", label: "Trust" },
      { href: "/mcp", label: "MCP" },
    ]);
    expect(new Set(nav.map((l) => l.href)).size).toBe(nav.length);
  });

  it("points every home anchor at a section that exists on the home page", () => {
    const home = readFileSync(join(process.cwd(), "app", "(site)", "page.tsx"), "utf8");
    for (const link of nav.filter((l) => l.href.startsWith("/#"))) {
      expect(home, link.href).toContain(`id="${link.href.slice(2)}"`);
    }
  });
});

describe("skill filter", () => {
  const groups = [
    { name: "Backend", skills: [{ name: "Python" }] },
    { name: "Data", skills: [{ name: "PostgreSQL" }] },
  ];

  it("shows every group for All", () => {
    expect(filterSkillGroups(groups, ALL_GROUPS)).toHaveLength(2);
  });

  it("shows one group when chosen", () => {
    expect(filterSkillGroups(groups, "Data").map((g) => g.name)).toEqual(["Data"]);
  });

  it("falls back to everything for an unknown choice", () => {
    expect(filterSkillGroups(groups, "Nope")).toHaveLength(2);
  });
});
