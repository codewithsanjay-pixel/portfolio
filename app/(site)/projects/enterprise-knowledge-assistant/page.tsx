import type { Metadata } from "next";
import Link from "next/link";
import { Facts } from "@/components/facts";
import { eka, person } from "@/content/site";

export const metadata: Metadata = {
  title: `${eka.title} | ${person.name}`,
};

export default function EkaPage() {
  return (
    <article className="wrap narrow article">
      <Link className="back-link" href="/#projects">
        Back to projects
      </Link>
      <p className="eyebrow">{eka.label}</p>
      <h1>{eka.title}</h1>

      <h2>The problem</h2>
      <p>{eka.problem}</p>

      <h2>How it fits together</h2>
      <Facts items={eka.parts} />

      <h2>What I owned</h2>
      <p>{eka.owned}</p>

      <h2>Design decisions</h2>
      <Facts items={eka.decisions} />

      <h2>Answer quality</h2>
      <p>{eka.quality}</p>

      <h2>Outcomes</h2>
      <Facts items={eka.outcomes} />

      <h2>Stack</h2>
      <ul className="tags" aria-label="Stack">
        {eka.stack.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>

      <h2>Where it ran</h2>
      <p>{eka.ranOn}</p>

      <h2>What this page leaves out</h2>
      <p>{eka.leavesOut}</p>
    </article>
  );
}
