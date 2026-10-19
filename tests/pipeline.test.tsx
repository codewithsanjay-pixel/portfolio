import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Pipeline } from "@/components/pipeline";

const html = renderToStaticMarkup(<Pipeline />);

describe("Pipeline", () => {
  it("renders six stages in order, matching the trace step keys", () => {
    const keys = [...html.matchAll(/data-step="(\w+)"/g)].map((m) => m[1]);
    expect(keys).toEqual(["rate", "input", "retrieve", "scope", "model", "checks"]);
    expect(html.match(/<li /g)).toHaveLength(6);
  });

  it("is a labelled ordered list with hidden decorative connectors", () => {
    expect(html).toMatch(/<ol [^>]*aria-label="[^"]+"/);
    const links = html.match(/<span class="pl-link d\d" aria-hidden="true">/g);
    expect(links).toHaveLength(5);
  });

  it("uses no inline styles and no em dash", () => {
    expect(html).not.toContain("style=");
    expect(html).not.toContain(String.fromCharCode(0x2014));
  });

  it("states the fixed refusal line", () => {
    expect(html).toContain("Every refusal returns the same fixed message.");
  });
});
