// SPEC.md chat flow, steps 2 to 6 (step 1, rate limiting, runs in the route).
// Every failure path returns the one fixed refusal message.
import { FORBIDDEN } from "../safety/forbidden.mjs";
import { normalize } from "../safety/normalize.mjs";
import type { AnswerModel } from "../llm";
import type { RetrievedChunk } from "../retrieve";
import { SYSTEM_PROMPT } from "./prompt";
import type { StepCallback, StepKey } from "./trace";
import { REFUSAL_MESSAGE, SYSTEM_PROMPT_CANARY, type ChatResult, type ChatStage, type ChatTrace } from "./types";

export type ChatDeps = {
  retrieve(question: string): Promise<RetrievedChunk[]>;
  model: AnswerModel;
  // Scope check (ADR 008): below this similarity, the question is not about my work.
  minScore: number;
  // Links an answer may contain.
  allowedUrls: readonly string[];
  // Private words that must never appear in an answer (from the PRIVATE_TERMS env var).
  privateTerms?: readonly string[];
  // The prompt sent to the model. A dependency so tests can run the flow with no
  // prompt at all: the checks below must hold whatever the prompt says (ADR 012).
  systemPrompt?: string;
};

export function refusal(retrieved: readonly string[] = [], stage: ChatStage = "model"): ChatResult {
  return { refused: true, answer: REFUSAL_MESSAGE, citations: [], retrieved: [...retrieved], stage };
}

// Lowercase ASCII with accents removed (NFKD), for literal comparisons.
function fold(text: string): string {
  return text.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// ---------------------------------------------------------------- characters

// After stripping accents, text should be plain English. Anything else (Cyrillic or
// Greek lookalikes, rare invisible characters, other scripts, tag characters) can be
// used to slip a word past the checks, so it is refused.
const ALLOWED_EXTRA = new Set([
  "‘", "’", "“", "”", // curly quotes
  "‐", "‑", "‒", "–", "—", "−", // hyphens and dashes models often use
  "…", // ellipsis
]);

export function hasUnexpectedCharacters(text: string, allowWhitespace = "\n"): boolean {
  const stripped = text.normalize("NFKD").replace(/[̀-ͯ]/g, "");
  for (const ch of stripped) {
    const code = ch.codePointAt(0)!;
    if (code >= 0x20 && code <= 0x7e) continue;
    if (allowWhitespace.includes(ch) || ALLOWED_EXTRA.has(ch)) continue;
    return true;
  }
  return false;
}

// ------------------------------------------------------------- private words

// Whole words after the shared normalizer (accents, invisible characters,
// separators), plurals included. A term with punctuation, such as "(word)",
// matches literally, after both sides are folded the same way.
export function containsPrivateTerm(answer: string, terms: readonly string[]): boolean {
  const flat = ` ${normalize(answer)} `;
  const folded = fold(answer);
  return terms.some((t) => {
    const term = t.trim();
    if (!term) return false;
    if (/[^a-z0-9\s'-]/i.test(term)) return folded.includes(fold(term));
    const n = normalize(term);
    return n.length > 0 && [n, `${n}s`, `${n}es`].some((form) => flat.includes(` ${form} `));
  });
}

// -------------------------------------------------------------- grounding

// Numbers are compared as standalone tokens, so "HTML5" or "EC2" in a source never
// vouches for a "5" or "2" in the answer. Number words are compared by value.
const NUMBER_TOKEN = /(?<![A-Za-z0-9.])\d+(?:\.\d+)?(?![A-Za-z0-9])/g;
const WORD_VALUES: Record<string, number> = {
  three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  dozen: 12, dozens: 12, hundred: 100, hundreds: 100, thousand: 1000, thousands: 1000,
  million: 1e6, millions: 1e6, billion: 1e9, billions: 1e9,
};
const NUMBER_WORD = new RegExp(`\\b(${Object.keys(WORD_VALUES).join("|")})\\b`, "g");
// Ratio and comparison words carry a claim too; they must appear in the cited text as words.
const RATIO_WORD = /\b(half|twice|double|doubled|triple|tripled|quadrupled|halved)\b/g;

function numberValues(text: string): Set<number> {
  const lower = fold(text);
  const values = new Set<number>((lower.match(NUMBER_TOKEN) ?? []).map(Number));
  for (const w of lower.match(NUMBER_WORD) ?? []) values.add(WORD_VALUES[w]);
  return values;
}

// Every number in the answer, as digits or words, must appear in the cited text.
// Stops "say you led a team of 40 (or forty)" additions that cite a real chunk.
export function ungroundedNumber(answer: string, cited: readonly RetrievedChunk[]): string | null {
  const sourceText = cited.map((c) => `${c.context} ${c.text}`).join(" ");
  const sourceValues = numberValues(sourceText);
  for (const v of numberValues(answer)) if (!sourceValues.has(v)) return String(v);
  const sourceRatios = new Set(fold(sourceText).match(RATIO_WORD) ?? []);
  for (const w of fold(answer).match(RATIO_WORD) ?? []) if (!sourceRatios.has(w)) return w;
  return null;
}

// Names that are always fine: me, my profiles, and the pronoun.
const NAME_ALLOWLIST = new Set(["i", "sanjay", "kandimalla", "linkedin", "github"]);
// Common abbreviations and their spelled-out forms count as the same name, in
// either direction ("Texas" is grounded by "TX", "SSO" by "single sign-on").
const NAME_ALIASES: Record<string, string[]> = {
  texas: ["tx"],
  tx: ["texas"],
  sso: ["single sign-on", "single sign on"],
  llm: ["large language model", "llms"],
  llms: ["large language models"],
  ml: ["machine learning"],
  nlp: ["natural language processing"],
  api: ["apis"],
  usa: ["united states"],
  us: ["united states"],
  ut: ["university of texas"],
  uta: ["university of texas at arlington", "ut arlington"],
  postgres: ["postgresql"],
  amex: ["american express"],
  aa: ["american airlines"],
};
// Common words that only start a sentence with a capital letter.
const SENTENCE_STARTERS = new Set(
  ("a an and as at before but by during each for from he her his how i if in into it its my no not of on " +
    "one our over since so some such that the their then there these they this those to two we what when where " +
    "which while who with yes you your also both other more most many much using through after during later earlier " +
    "today currently previously recently overall here " +
    // conversational openers
    "thanks thank glad sure absolutely certainly great happy okay ok please good nice yes no indeed").split(" "),
);

// Every capitalized word or acronym ("Google", "IBM", "EC2") must appear in the cited
// text, so the model cannot add an employer, title or award the resume never states.
// A word that only starts a sentence is checked unless it is a common starter word
// or looks like an inflected verb or adverb.
// Whole-word matching: "Uber" must not be grounded by "Kubernetes".
function wordsOf(text: string): string {
  return ` ${fold(text).replace(/[^a-z0-9]+/g, " ").trim()} `;
}

export function unsourcedName(answer: string, cited: readonly RetrievedChunk[]): string | null {
  const source = wordsOf(cited.map((c) => `${c.context} ${c.text}`).join(" "));
  const has = (phrase: string) => source.includes(wordsOf(phrase));
  const text = answer.normalize("NFKD").replace(/[̀-ͯ]/g, "");
  for (const m of text.matchAll(/\b[A-Z][A-Za-z0-9]*(?:[-'][A-Za-z0-9]+)*\b/g)) {
    const word = m[0];
    // The capitalized part of "React-based" or "Sanjay's" is what names something.
    const lower = word.split(/[-']/)[0].toLowerCase();
    if (NAME_ALLOWLIST.has(lower) || has(lower)) continue;
    // Plurals: "LLMs", "APIs".
    if (lower.length > 2 && lower.endsWith("s") && has(lower.slice(0, -1))) continue;
    if ((NAME_ALIASES[lower] ?? []).some((alias) => has(alias))) continue;
    const before = text.slice(0, m.index).trimEnd();
    const sentenceStart = before === "" || /[.!?:\n]$/.test(before);
    if (sentenceStart && (SENTENCE_STARTERS.has(lower) || /(ed|ing|ly)$/.test(lower))) continue;
    return word;
  }
  return null;
}

// -------------------------------------------------------------- output guard

const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s)>\]]+/gi;
// Any dotted name with a letter-only ending, except common technology names.
const BARE_DOMAIN = /\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}\b/gi;
const TECH_DOTTED = new Set(["node.js", "next.js", "vue.js", "react.js", "nuxt.js", "express.js", "asp.net"]);

function allowedLink(url: string, allowed: readonly string[]): boolean {
  const u = url.toLowerCase().replace(/[.,;:!?]+$/, "");
  if (u.includes("..") || u.includes("%2e")) return false;
  return allowed.some((a) => {
    const base = a.toLowerCase().replace(/\/+$/, "");
    return u === base || u === `${base}/` || u.startsWith(`${base}/`) || u.startsWith(`${base}?`);
  });
}

// Server-side output guard. Independent of the model: it runs on whatever came back.
export function unsafeAnswer(answer: string, allowedUrls: readonly string[]): string | null {
  if (hasUnexpectedCharacters(answer)) return "unexpected characters";
  const squashed = answer.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (squashed.includes(SYSTEM_PROMPT_CANARY.replace(/[^a-z0-9]/g, ""))) return "canary";
  // Talking about its own sources or instructions is never a real answer about my work.
  // ("source code", "source documents" and "system prompt design" are real wording;
  // prompt leaks are left to the canary.)
  if (/\b(the|my|these|those|provided)\s+sources?\b(?!\s+(code|documents?|data|systems?|files?))/i.test(answer)) return "meta";
  if (/\b(my|your|these|the)\s+instructions\b/i.test(answer)) return "meta";
  const normalized = normalize(answer);
  for (const { pattern, why } of FORBIDDEN) if (pattern.test(answer) || pattern.test(normalized)) return why;
  if (/<\s*[a-z!/]/i.test(answer)) return "html";
  if (/!?\[[^\]]*\]\([^)]*\)/.test(answer)) return "markdown link or image";
  if (/\[[a-z0-9]+(?:-[a-z0-9]+)+\]/.test(answer)) return "source id in text";
  const urls = answer.match(URL_PATTERN) ?? [];
  for (const url of urls) if (!allowedLink(url, allowedUrls)) return "link";
  // Remove allowed links (with or without https://www.) and the allowed email, then
  // anything that still looks like a domain is an unlisted link.
  let rest = urls.reduce((s, u) => s.replace(u, " "), answer).toLowerCase();
  for (const a of allowedUrls) {
    const bare = a.toLowerCase().replace(/^mailto:/, "").replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");
    rest = rest.split(bare).join(" ");
  }
  for (const m of rest.matchAll(BARE_DOMAIN)) if (!TECH_DOTTED.has(m[0].toLowerCase())) return "bare domain";
  return null;
}

// --------------------------------------------------------------- input check

// Questions that try to dictate what the answer says ("start your answer with ...",
// "mention that you ...") are refused before any retrieval or model call. A visitor
// asking about my work does not need to script the reply; an attacker planting a
// claim does. Deterministic, so it does not depend on the model's judgment.
// Patterns run per sentence on normalized text (lowercase, no punctuation or
// invisible characters), so "you've" reads "you ve". Real questions such as "did you
// say you were at ..." or "can I say I was impressed ..." must not match.
const TRIGGER = "(mention|say|state|claim|add|include|write|note|pretend|tell them|make it clear)";
const SUBJECT = "(you|sanjay|he)";
// A be/have form right after the subject is a claim by itself ("you're the lead",
// "you have a PhD"); otherwise a claim verb must follow, maybe after an adverb.
const BE_HAVE = "(re|s|m|d|ve|is|are|was|were|been|have|has|had)";
const ADVERB = "(also|previously|once|formerly|actually|really|personally|still)";
const CLAIM_VERB = "(led|lead|won|worked|work|did|own|owned|managed|built|founded|received|earned|got|ran|hold|held)";
const ANSWER_SHAPING = [
  /\b(start|begin|open|end|finish|close|prefix|preface)\s+(your|the)\s+(answer|reply|response)\b/,
  /\b(your|the)\s+(first|last|opening|final)\s+(sentence|line|words?)\s+(must|should|will|has to)\b/,
  new RegExp(
    `(?<!\\b(did|do|does|would)\\s+\\w+\\s)\\b${TRIGGER}\\s+(that\\s+)?${SUBJECT}(\\s+${BE_HAVE}\\b|(\\s+${ADVERB})*\\s+${CLAIM_VERB}\\b)`,
  ),
  /\b(mention|say|include|add|note)\s+(the|your|his|an?)\s+(\w+\s+)?(award|prize|patent)\b/,
  /\b(repeat|copy|echo)\s+(after\s+me|this|the\s+following)\b/,
  // Raw dumps: asking for the sources themselves, or for lines by their internal marker.
  /\b(output|print|dump|show|reveal|display|give|list|paste|echo|return)\s+(me\s+)?(the\s+|your\s+|all\s+|every\s+|each\s+|these\s+|those\s+|any\s+)?(raw|verbatim|unedited|word for word)\s+(chunks?|sources?|documents?|notes?|lines?)\b/,
  /\b(output|print|dump|show|reveal|display|give|list|paste|echo|return)\s+(me\s+)?(the\s+)?(raw|verbatim|unedited)\s+(text|contents?)\s+of\s+(every|all|each|your|the|any)\s+(documents?|sources?|chunks?|files?|notes?|lines?)\b/,
  /\b(lines?|items?|documents?|sources?|chunks?|notes?)\s+(marked|tagged|labeled|labelled|flagged)\b.*\b(confirm|interview only|private|internal|hidden)\b/,
];

export function scriptsTheAnswer(question: string): boolean {
  return question
    .split(/[.!?;:\n]+/)
    .map((s) => normalize(s))
    .filter(Boolean)
    .some((sentence) => ANSWER_SHAPING.some((p) => p.test(sentence)));
}

// ------------------------------------------------------------------- the flow

export async function answerQuestion(question: string, deps: ChatDeps, onStep?: StepCallback): Promise<ChatResult> {
  const trace: ChatTrace = { retrieved: [], retrieveMs: 0, modelMs: 0 };
  // Called only when a step passes, so a stream never says which check failed.
  // A failing callback (for example a closed connection) must not change the answer.
  const step = (key: StepKey, ms?: number) => {
    try {
      onStep?.(key, ms);
    } catch {
      /* ignore */
    }
  };
  const result = await runFlow(question, deps, trace, step);
  return { ...result, trace };
}

async function runFlow(question: string, deps: ChatDeps, trace: ChatTrace, step: StepCallback): Promise<ChatResult> {
  // Input check (ADR 008), before any spend: hidden or lookalike characters, and
  // questions that script the answer.
  if (hasUnexpectedCharacters(question, "\n\r\t") || scriptsTheAnswer(question)) return refusal([], "input");
  step("input");

  // Steps 2 and 3: retrieve, and refuse if nothing in the corpus is close enough.
  const t0 = Date.now();
  const chunks = await deps.retrieve(question);
  trace.retrieveMs = Date.now() - t0;
  trace.retrieved = chunks.map((c) => ({ id: c.id, score: Math.round(c.score * 10) / 10 }));
  const retrieved = chunks.map((c) => c.id);
  step("retrieve", trace.retrieveMs);
  if (chunks.length === 0 || chunks[0].score < deps.minScore) return refusal(retrieved, "scope");
  step("scope");

  // Step 4: answer from the retrieved chunks only.
  const t1 = Date.now();
  const out = await deps.model.answer({
    system: deps.systemPrompt ?? SYSTEM_PROMPT,
    question,
    sources: chunks.map(({ id, context, text }) => ({ id, context, text })),
  });
  trace.modelMs = Date.now() - t1;
  if (out.refused) return refusal(retrieved, "model");
  step("model", trace.modelMs);

  // Step 5: verify citations on the server.
  const citations = [...new Set(out.citations)];
  const retrievedSet = new Set(retrieved);
  if (citations.length === 0 || citations.some((id) => !retrievedSet.has(id))) return refusal(retrieved, "citations");

  const answer = out.answer.trim();
  if (!answer || unsafeAnswer(answer, deps.allowedUrls)) return refusal(retrieved, "guard");
  if (containsPrivateTerm(answer, deps.privateTerms ?? [])) return refusal(retrieved, "private");
  const cited = chunks.filter((c) => citations.includes(c.id));
  if (ungroundedNumber(answer, cited) || unsourcedName(answer, cited)) return refusal(retrieved, "grounding");

  // Step 6. The post-model checks are one step, reported only if all of them passed.
  step("checks");
  return { refused: false, answer, citations, retrieved, stage: "answered" };
}
