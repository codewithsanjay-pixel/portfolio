// Security headers sent with every response (step 9).
import { describe, expect, it } from "vitest";
import { SECURITY_HEADERS } from "@/lib/security/headers.mjs";
import config from "@/next.config";

const byKey = Object.fromEntries(SECURITY_HEADERS.map((h) => [h.key, h.value]));

describe("security headers", () => {
  it("include the standard set", () => {
    expect(byKey["X-Frame-Options"]).toBe("DENY");
    expect(byKey["X-Content-Type-Options"]).toBe("nosniff");
    expect(byKey["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(byKey["Strict-Transport-Security"]).toMatch(/max-age=\d{8,}/);
    expect(byKey["Cross-Origin-Opener-Policy"]).toBe("same-origin");
    for (const feature of ["camera", "microphone", "geolocation", "payment"]) {
      expect(byKey["Permissions-Policy"]).toContain(`${feature}=()`);
    }
  });

  it("are applied to every path, and the framework is not advertised", async () => {
    const nextConfig = config("phase-test");
    expect(nextConfig.poweredByHeader).toBe(false);
    const rules = await nextConfig.headers!();
    expect(rules).toEqual([{ source: "/:path*", headers: SECURITY_HEADERS }]);
  });
});
