/* eslint-disable @typescript-eslint/no-explicit-any -- loose JSON-RPC replies and mocks in tests */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

let host: string | null = "example.test";
vi.mock("next/headers", () => ({
  headers: async () => new Headers(host ? { host } : {}),
}));
vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: any) => <a href={href} {...rest}>{children}</a> }));
vi.mock("@/app/mcp.css", () => ({}));

const { default: McpPage } = await import("@/app/(site)/mcp/page");
const { toolContracts } = await import("@/lib/mcp/contracts");

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");

describe("/mcp page", () => {
  it("renders the title, every tool from tools.ts, and curl examples with the host", async () => {
    host = "example.test";
    const html = renderToStaticMarkup(await McpPage());
    expect(html).toContain("Read-only MCP server");
    for (const t of toolContracts()) {
      expect(html).toContain(t.name);
      expect(html).toContain(esc(t.description));
    }
    expect(html).toContain("https://example.test/api/mcp");
    expect(html).toContain("tools/list");
    expect(html).toContain("tools/call");
    expect(html).toContain("No writes");
    expect(html.includes("—")).toBe(false);
    expect(html).not.toMatch(/style=|onclick=/i);
  });

  it("falls back to a relative path for an odd host", async () => {
    host = "bad host/<x>";
    const html = renderToStaticMarkup(await McpPage());
    expect(html).toContain("/api/mcp");
    expect(html).not.toContain("bad host");
  });
});
