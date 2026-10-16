// Splits docs/RESUME.md into chunks with stable ids for retrieval and citations.
//
// Id = section key + optional subsection key + slug of the bullet's first words,
// e.g. "aa-built-and-optimized-rag-pipelines". An id changes only when that
// bullet's opening words change. Evals and citations depend on these ids.
//
// Never chunked:
// - any line containing [CONFIRM or [INTERVIEW-ONLY] (not approved for the chat)
// - in "Detail from me", any item not tagged [PUBLIC-GENERAL]
// - meta sections and instructions to Claude Code (see SKIP_SECTIONS, isMetaLine)
// Pure: no file access. Loaders live in ./load.ts (scripts, tests) and ./resume.ts (chat route).

export type Chunk = {
  id: string;
  source: string;
  // Heading path, e.g. "Experience > Software Development Engineer. American Airlines. ..."
  context: string;
  text: string;
};

const SECTION_KEYS: Record<string, string> = {
  Summary: "summary",
  "Technical skills": "skills",
  Experience: "",
  "Detail from me": "detail",
  Projects: "project",
  Education: "edu",
  Achievements: "award",
};

const SKIP_SECTIONS = new Set(["Decisions about what is public"]);

// Employer headings map to short, readable keys.
const EMPLOYER_KEYS: [RegExp, string][] = [
  [/American Airlines/, "aa"],
  [/American Express/, "amex"],
];

// Matches [CONFIRM...], [ confirm ...], [INTERVIEW-ONLY], [INTERVIEW ONLY: ...] and similar.
export const BLOCKED = /\[\s*(CONFIRM|INTERVIEW[\s_-]*ONLY)/i;
const PUBLIC_TAG = "[PUBLIC-GENERAL]";

export function slug(text: string, words = 5): string {
  return text
    .toLowerCase()
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, words)
    .join("-");
}

function isMetaLine(line: string): boolean {
  return /^NOTE FOR CLAUDE CODE/.test(line) || /^Confirmed:/.test(line);
}

function subsectionKey(section: string, heading: string): string {
  if (section === "Experience") {
    for (const [pattern, key] of EMPLOYER_KEYS) if (pattern.test(heading)) return key;
  }
  return slug(heading.split(":")[0], 6);
}

export function chunkResume(markdown: string, source = "docs/RESUME.md"): Chunk[] {
  const chunks: Chunk[] = [];
  const profile: string[] = [];
  let section = "";
  let sub = "";
  let subKey = "";
  let subBlocked = false;
  let paragraph: string[] = [];

  const push = (id: string, context: string, text: string) => {
    if (chunks.some((c) => c.id === id)) throw new Error(`Duplicate chunk id: ${id}`);
    chunks.push({ id, source, context, text });
  };

  const flushParagraph = () => {
    if (paragraph.length > 0 && section === "Projects" && sub) {
      push(`project-${subKey}`, `Projects > ${sub}`, paragraph.join(" "));
    }
    paragraph = [];
  };

  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith("# ")) continue;

    if (line.startsWith("## ")) {
      flushParagraph();
      section = line.slice(3).trim();
      sub = "";
      subKey = "";
      subBlocked = false;
      continue;
    }
    if (line.startsWith("### ")) {
      flushParagraph();
      sub = line.slice(4).trim();
      subKey = subsectionKey(section, sub);
      // A marker on a heading holds back the whole subsection.
      subBlocked = BLOCKED.test(sub);
      if (section === "Experience" && !subBlocked) {
        push(`${subKey}-role`, "Experience", sub);
      }
      continue;
    }
    if (subBlocked || !line || isMetaLine(line)) continue;
    if (BLOCKED.test(line)) {
      // A marker on its own line under a heading would leave the text it is
      // about in the corpus. Fail loudly instead of guessing what it covers.
      const inScope = sub && section in SECTION_KEYS && !SKIP_SECTIONS.has(section);
      if (inScope && !line.startsWith("- ")) {
        throw new Error(
          `RESUME.md: a marker on its own line under "${sub}" does not hold back anything. ` +
            `Put it on the bullet it governs, on the heading to hold back the whole subsection, ` +
            `or in "Decisions about what is public".`,
        );
      }
      continue;
    }

    // Preamble: name, location, contact.
    if (!section) {
      if (/^(Name|Location|Contact):/.test(line)) profile.push(line);
      continue;
    }
    if (SKIP_SECTIONS.has(section) || !(section in SECTION_KEYS)) continue;

    if (line.startsWith("- ")) {
      let text = line.slice(2).trim();
      if (section === "Detail from me") {
        if (!sub || !text.startsWith(PUBLIC_TAG)) continue;
        text = text.slice(PUBLIC_TAG.length).trim();
      }
      const base = SECTION_KEYS[section];
      const label = section === "Technical skills" ? slug(text.split(":")[0], 4) : slug(text);
      const id = [base, subKey, label].filter(Boolean).join("-");
      const context = sub ? `${section} > ${sub}` : section;
      push(id, context, text);
    } else if (section === "Projects" && sub) {
      paragraph.push(line);
    }
  }
  flushParagraph();

  if (profile.length > 0) {
    chunks.unshift({ id: "profile", source, context: "Profile", text: profile.join(" ") });
  }
  return chunks;
}
