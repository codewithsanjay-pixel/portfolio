import Link from "next/link";
import { notFound as copy } from "@/content/site";

// Replaces Next.js's built-in 404 page, which uses inline style attributes that the
// strict Content-Security-Policy blocks (ADR 009).
export default function NotFound() {
  return (
    <main id="main" className="wrap narrow article">
      <h1>{copy.title}</h1>
      <p className="lede">{copy.body}</p>
      <p>
        <Link href="/">{copy.home}</Link>
      </p>
    </main>
  );
}
