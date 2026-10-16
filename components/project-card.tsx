import Link from "next/link";

type Props = {
  title: string;
  meta: string;
  summary: string;
  href?: string;
  linkLabel?: string;
  tags?: readonly string[];
  lead?: boolean;
};

export function ProjectCard({ title, meta, summary, href, linkLabel, tags, lead }: Props) {
  return (
    <article className={`card${lead ? " card-lead" : ""}`}>
      <h3>{title}</h3>
      <p className="card-meta">{meta}</p>
      <p>{summary}</p>
      {tags && tags.length > 0 ? (
        <ul className="tags" aria-label="Stack">
          {tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      ) : null}
      {href ? (
        <p className="card-link">
          <Link href={href}>{linkLabel ?? "Read more"}</Link>
        </p>
      ) : null}
    </article>
  );
}
