// Tool contracts only: name, description and schemas. No handlers and no corpus code,
// so the /mcp page can show them without pulling the resume loader into its bundle.
import type { JsonSchema } from "./schema";

export type ToolContract = {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  outputSchema: JsonSchema;
};

export const MAX_QUERY_CHARS = 200;

// `sections` is the list of public section headings; the page leaves it out.
export function toolContracts(sections?: string[]): ToolContract[] {
  return [
    {
      name: "search_resume",
      description:
        "Search Sanjay Kandimalla's public resume and project notes with a plain-English query, for example \"RAG pipelines\" or \"Python experience\". Returns up to 5 short passages, best match first, each with its section heading and a similarity score from 0 to 1. Returns an empty list when nothing is close enough. Read-only.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "What to look for, in plain English.", minLength: 1, maxLength: MAX_QUERY_CHARS },
        },
        required: ["query"],
        additionalProperties: false,
      },
      outputSchema: {
        type: "object",
        properties: {
          passages: {
            type: "array",
            description: "Matching passages, best first. May be empty.",
            items: {
              type: "object",
              properties: {
                section: { type: "string", description: "Heading of the section the passage comes from." },
                text: { type: "string", description: "The passage text." },
                score: { type: "number", description: "Similarity from 0 to 1, rounded to one decimal." },
              },
              required: ["section", "text", "score"],
              additionalProperties: false,
            },
          },
        },
        required: ["passages"],
        additionalProperties: false,
      },
},
    {
      name: "get_section",
      description:
        "Return the full public text of one section of the resume, for example \"Summary\" or \"Technical skills\". Use search_resume first if you do not know which section you need. The section must be one of the listed values. Read-only.",
      inputSchema: {
        type: "object",
        properties: {
          section: { type: "string", description: "Section heading to read.", ...(sections ? { enum: sections } : {}) },
        },
        required: ["section"],
        additionalProperties: false,
      },
      outputSchema: {
        type: "object",
        properties: {
          section: { type: "string", description: "The section heading that was asked for." },
          text: { type: "string", description: "The section text, one item per line." },
        },
        required: ["section", "text"],
        additionalProperties: false,
      },
},
    {
      name: "list_evals",
      description:
        "List the public evaluation sets that test this site's chat assistant: each set's name, what it checks, and how many cases it has. Takes no arguments. Private test sets are never listed. Read-only.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      outputSchema: {
        type: "object",
        properties: {
          sets: {
            type: "array",
            description: "One entry per public eval set.",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "Set name, for example Golden." },
                tests: { type: "string", description: "What the set checks." },
                cases: { type: "number", description: "Number of cases in the set." },
              },
              required: ["name", "tests", "cases"],
              additionalProperties: false,
            },
          },
        },
        required: ["sets"],
        additionalProperties: false,
      },
}
  ];
}
