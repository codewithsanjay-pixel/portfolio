import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { BreakIt, type BreakItCase } from "@/components/break-it";
import { chat, howItsBuilt, person, repoBranch, repoUrl, trustPage } from "@/content/site";
import { containsPrivateTerm } from "@/lib/chat/answer";
import { FORBIDDEN } from "@/lib/safety/forbidden.mjs";

export const metadata: Metadata = {
  title: `${trustPage.title} | ${person.name}`,
};

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (whole, key: string) => (key in values ? String(values[key]) : whole));

// The public injection set only (ADR 014). Read at request time, so the file is not bundled
// into the page, and anything the site never prints (FORBIDDEN) is dropped before it is
// sent to the browser. Private eval sets are never read here.
function publicInjectionCases(): { total: number; shown: BreakItCase[] } {
  const raw = JSON.parse(readFileSync(join(process.cwd(), "evals", "injection.json"), "utf8")) as { cases: Record<string, unknown>[] };
  const valid = raw.cases.filter(
    (c) => typeof c.id === "string" && typeof c.question === "string" && (c.expect === "refuse" || c.expect === "answer"),
  );
  const privateTerms = (process.env.PRIVATE_TERMS ?? "").split("|").map((t) => t.trim()).filter(Boolean);
  const shown = valid
    .filter((c) => !FORBIDDEN.some((rule) => rule.pattern.test(c.question as string)))
    .filter((c) => !containsPrivateTerm(`${c.id as string} ${c.question as string}`, privateTerms))
    .map((c) => ({ id: c.id as string, question: c.question as string, expect: c.expect as "refuse" | "answer" }));
  return { total: valid.length, shown };
}

export default function TrustPage() {
  const table = howItsBuilt.sections.find((s) => s.table)?.table;
  const rows = table?.rows ?? [];
  const total = rows.reduce((n, r) => n + r.cases, 0);
  const passed = rows.reduce((n, r) => n + r.passed, 0);
  const { total: injectionTotal, shown } = publicInjectionCases();
  const b = trustPage.breakIt;

  return (
    <article className="wrap narrow article trust">
      <Link className="back-link" href="/">
        Back to home
      </Link>
      <h1>{trustPage.title}</h1>
      <p className="lede">{trustPage.intro}</p>

      <section className="numbered-section" aria-labelledby="trust-what">
        <p className="card-num">01</p>
        <h2 id="trust-what">{trustPage.whatTitle}</h2>
        <ul>
          {trustPage.what.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="numbered-section" aria-labelledby="trust-controls">
        <p className="card-num">02</p>
        <h2 id="trust-controls">{trustPage.controlsTitle}</h2>
        <p>{trustPage.controlsIntro}</p>
        <div className="table-wrap">
          <table className="trust-table">
            <caption className="visually-hidden">{trustPage.controlsTitle}</caption>
            <thead>
              <tr>
                <th scope="col">{trustPage.controlsColumns.control}</th>
                <th scope="col">{trustPage.controlsColumns.does}</th>
                <th scope="col">{trustPage.controlsColumns.where}</th>
              </tr>
            </thead>
            <tbody>
              {trustPage.controls.map((row) => (
                <tr key={row.control}>
                  <th scope="row">{row.control}</th>
                  <td>{row.does}</td>
                  <td>
                    <ul className="file-list">
                      {row.files.map((file) => (
                        <li key={file}>
                          <a href={`${repoUrl}/blob/${repoBranch}/${file}`} rel="noreferrer">
                            <code>{file}</code>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="numbered-section" aria-labelledby="trust-not">
        <p className="card-num">03</p>
        <h2 id="trust-not">{trustPage.notTitle}</h2>
        <ul>
          {trustPage.not.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="numbered-section" aria-labelledby="trust-evals">
        <p className="card-num">04</p>
        <h2 id="trust-evals">{trustPage.evalsTitle}</h2>
        {table ? (
          <>
            <p>{fill(trustPage.evalsSummary, { caption: table.caption, passed, total, sets: rows.length })}</p>
            <ul>
              {rows.map((r) => (
                <li key={r.set}>{fill(trustPage.evalsSet, { set: r.set, cases: r.cases, tests: r.tests })}</li>
              ))}
            </ul>
            <p className="table-note">{table.note}</p>
          </>
        ) : null}
        <p>
          {trustPage.evalsMore.split("How it's built")[0]}
          <Link href="/how-its-built">How it&apos;s built</Link>
          {trustPage.evalsMore.split("How it's built")[1]}
        </p>
      </section>

      <section className="numbered-section" aria-labelledby="trust-break">
        <p className="card-num">05</p>
        <h2 id="trust-break">{b.title}</h2>
        <p>{b.intro}</p>
        <p className="table-note">{b.limitNote}</p>
        {shown.length < injectionTotal ? (
          <p className="table-note">{fill(b.hiddenNote, { shown: shown.length, total: injectionTotal })}</p>
        ) : null}
        <BreakIt
          cases={shown}
          text={{
            listLabel: b.listLabel,
            expectedLabel: b.expectedLabel,
            expected: b.expected,
            actualLabel: b.actualLabel,
            actual: b.actual,
            matches: b.matches,
            differs: b.differs,
            send: b.send,
            sending: b.sending,
            sourcesLabel: chat.sourcesLabel,
            refusal: chat.refusal,
            errors: chat.errors,
            fallbackError: chat.fallbackError,
          }}
        />
        <p className="table-note">{b.storeNote}</p>
      </section>
    </article>
  );
}
