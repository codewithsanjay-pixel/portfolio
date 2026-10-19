// Renders every real page and checks what a visitor would see.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// The command palette in the header uses the app router, which is not mounted in these renders.
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {} }) }));
import SiteLayout from "@/app/(site)/layout";
import Home from "@/app/(site)/page";
import EkaPage from "@/app/(site)/projects/enterprise-knowledge-assistant/page";
import HowItsBuilt from "@/app/(site)/how-its-built/page";
import TrustPage from "@/app/(site)/trust/page";
import pkg from "@/package.json";
import { FORBIDDEN } from "@/scripts/check-built-output.mjs";
import { eka, focus, howItsBuilt, links, person, proofStrip, timeline } from "@/content/site";

const EXAMPLE_MARKERS = ["Alex Sample", "Example Airline", "Example Payments"];

function text(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/&#x27;|&apos;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ");
}

function expectClean(html: string) {
  for (const { pattern, why } of FORBIDDEN) {
    expect(pattern.test(html), why).toBe(false);
  }
  for (const marker of EXAMPLE_MARKERS) {
    expect(html.includes(marker), marker).toBe(false);
  }
  expect(html.includes("—"), "em dash").toBe(false);
}

const pages = {
  home: renderToStaticMarkup(<Home />),
  eka: renderToStaticMarkup(<EkaPage />),
  howItsBuilt: renderToStaticMarkup(<HowItsBuilt />),
  trust: renderToStaticMarkup(<TrustPage />),
};

describe("home page", () => {
  const visible = text(pages.home);

  it("shows the intro, focus areas and every timeline entry", () => {
    expect(visible).toContain(person.headline);
    for (const area of focus) expect(visible).toContain(area.title);
    for (const entry of timeline) expect(visible).toContain(entry.title);
  });

  it("has sections in the spec order", () => {
    const ids = [...pages.home.matchAll(/<section id="([^"]+)"/g)].map((m) => m[1]);
    expect(ids).toEqual(["pipeline", "focus", "experience", "skills", "projects", "about", "contact"]);
  });

  it("shows three derived fact tiles under the link buttons, each linking to where it can be checked", () => {
    const rows = howItsBuilt.sections.find((x) => x.table)!.table!.rows;
    const total = rows.reduce((n, r) => n + r.cases, 0);
    const tiles = [...pages.home.matchAll(/<a class="fact-tile" href="([^"]+)">(.*?)<\/a>/g)].map((m) => ({ href: m[1], text: text(m[2]).trim() }));
    expect(tiles).toEqual([
      { href: "/how-its-built", text: `${total} ${proofStrip.evals}` },
      { href: expect.stringMatching(/\/blob\/main\/package\.json$/), text: `${Object.keys(pkg.dependencies).length} ${proofStrip.deps}` },
      { href: expect.stringMatching(/\/blob\/main\/scripts\/check-built-output\.mjs$/), text: `${proofStrip.secrets} ${proofStrip.secretsLabel}` },
    ]);
    expect(pages.home.indexOf("facts-strip")).toBeGreaterThan(pages.home.indexOf("LinkedIn"));
  });

  it("puts role detail inside expandable details", () => {
    expect((pages.home.match(/<details>/g) ?? []).length).toBe(2);
  });

  it("links contact details and the project page", () => {
    expect(pages.home).toContain(`mailto:${links.email}`);
    expect(pages.home).toContain(links.github);
    expect(pages.home).toContain(links.linkedin);
    expect(pages.home).toContain(`/projects/${eka.slug}`);
  });

  it("leaves out everything still waiting for approval", () => {
    for (const pending of ["since 2021", "Resume (PDF)", "Notes", "Not connected yet"]) {
      expect(visible.includes(pending), pending).toBe(false);
    }
  });

  it("contains no markers, ruled-out wording or example text", () => {
    expectClean(pages.home);
  });
});

describe("project page", () => {
  it("shows every section and stays general", () => {
    const visible = text(pages.eka);
    for (const heading of ["The problem", "How it fits together", "What I owned", "Answer quality", "Stack", "What this page leaves out"]) {
      expect(visible).toContain(heading);
    }
    expectClean(pages.eka);
  });
});

describe("how it's built page", () => {
  it("shows the outline and nothing unapproved", () => {
    expect(text(pages.howItsBuilt)).toContain("How the chat answers a question");
    expect(text(pages.howItsBuilt)).toContain("are sent to OpenAI");
    expectClean(pages.howItsBuilt);
  });
});

describe("trust page", () => {
  it("has its five sections in order and is clean", () => {
    const visible = text(pages.trust);
    const headings = [...pages.trust.matchAll(/<h2 id="[^"]+">([^<]+)<\/h2>/g)].map((m) => m[1]);
    expect(headings).toEqual(["What the assistant is", "What enforces that, and where", "What it does not do", "What the evals cover", "Try to break it"]);
    expect(visible).toContain("Trust and limits");
    expectClean(pages.trust);
  });

  it("takes eval counts from the how-it's-built table", () => {
    const rows = howItsBuilt.sections.find((x) => x.table)!.table!.rows;
    const total = rows.reduce((n, r) => n + r.cases, 0);
    const passed = rows.reduce((n, r) => n + r.passed, 0);
    expect(text(pages.trust)).toContain(`${passed} of ${total} cases passed, in ${rows.length} sets`);
  });
});

describe("site layout", () => {
  it("renders header, nav and footer without the example link by default", () => {
    const html = renderToStaticMarkup(<SiteLayout params={Promise.resolve({})}>child</SiteLayout>);
    expect(html).toContain(person.name);
    expect(html).toContain('href="/#experience"');
    expect(html).toContain('href="/trust"');
    expect(html).toContain('href="/mcp"');
    expect(html).not.toContain('href="/example"');
    expectClean(html);
  });
});
