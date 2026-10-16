import type { Metadata } from "next";
import Link from "next/link";
import { EvalTable } from "@/components/eval-table";
import { howItsBuilt, person, repoBranch, repoUrl } from "@/content/site";

export const metadata: Metadata = {
  title: `How it's built | ${person.name}`,
};

export default function HowItsBuilt() {
  return (
    <article className="wrap narrow article">
      <Link className="back-link" href="/">
        Back to home
      </Link>
      <h1>How it&apos;s built</h1>
      <p className="lede">{howItsBuilt.intro}</p>
      <p>{howItsBuilt.dataNote}</p>
      {howItsBuilt.sections.map((section, i) => {
        const List = section.ordered ? "ol" : "ul";
        return (
          <section key={section.title} className="numbered-section" aria-labelledby={`hib-${i}`}>
            <p className="card-num">{String(i + 1).padStart(2, "0")}</p>
            <h2 id={`hib-${i}`}>{section.title}</h2>
            {section.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
            {section.points ? (
              <List>
                {section.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </List>
            ) : null}
            {section.after?.map((p) => <p key={p}>{p}</p>)}
            {section.table ? (
              <>
                <EvalTable rows={section.table.rows} caption={section.table.caption} />
                <p className="table-note">
                  {section.table.caption}. {section.table.note}
                </p>
              </>
            ) : null}
            <p className="files-label">Files behind this section</p>
            <ul className="file-list">
              {section.files.map((file) => (
                <li key={file}>
                  <a href={`${repoUrl}/blob/${repoBranch}/${file}`} rel="noreferrer">
                    <code>{file}</code>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </article>
  );
}
