import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sanjay Kandimalla",
  description: "Backend engineer building retrieval systems, AI agents and secure integrations.",
};

// Applies a saved theme before first paint. Allowed by the per-request CSP nonce
// (ADR 009). Reading the request headers makes every page render per request,
// which nonces require.
const THEME_SCRIPT =
  '(function(){try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()';

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Browsers hide the nonce attribute after load, so React must not compare it. */}
        <script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
