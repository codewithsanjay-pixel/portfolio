import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { person } from "@/content/site";
import { schemaRows, type JsonSchema } from "@/lib/mcp/schema";
import { toolContracts } from "@/lib/mcp/contracts";
import "../../mcp.css";

export const metadata: Metadata = {
  title: `Read-only MCP server | ${person.name}`,
  description: "A small read-only Model Context Protocol server over HTTP that answers questions from the public resume text.",
};

// The endpoint as the visitor reached it. Only a plain host name is trusted; anything
// else falls back to a relative path.
async function endpointUrl(): Promise<string> {
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].trim();
  if (!/^[a-z0-9.-]+(:\d{1,5})?$/i.test(host)) return "/api/mcp";
  const local = /^(localhost|127\.0\.0\.1)(:|$)/i.test(host);
  const forwarded = (h.get("x-forwarded-proto") ?? "").split(",")[0].trim();
  const proto = forwarded === "http" || forwarded === "https" ? forwarded : local ? "http" : "https";
  return `${proto}://${host}/api/mcp`;
}

function curl(url: string, payload: object): string {
  return [
    `curl -s ${url} \\`,
    `  -H 'Content-Type: application/json' \\`,
    `  -H 'Accept: application/json, text/event-stream' \\`,
    `  -d '${JSON.stringify(payload)}'`,
  ].join("\n");
}

function ContractTable({ label, schema }: { label: string; schema: JsonSchema }) {
  const rows = schemaRows(schema);
  if (rows.length === 0) return <p className="mcp-none">{label}: none.</p>;
  return (
    <div className="table-wrap">
      <table>
        <caption className="visually-hidden">{label}</caption>
        <thead>
          <tr>
            <th scope="col">{label}</th>
            <th scope="col">Type</th>
            <th scope="col">Meaning</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.path}>
              <td>
                <code>{r.path}</code>
                {r.required ? null : <span className="mcp-opt"> optional</span>}
              </td>
              <td>{r.type}</td>
              <td>
                {r.description}
                {r.constraints ? ` (${r.constraints})` : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function McpPage() {
  const url = await endpointUrl();
  const tools = toolContracts();
  const list = curl(url, { jsonrpc: "2.0", id: 1, method: "tools/list" });
  const call = curl(url, {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: { name: "search_resume", arguments: { query: "RAG pipelines" } },
  });
  return (
    <article className="wrap narrow article mcp">
      <Link className="back-link" href="/">
        Back to home
      </Link>
      <h1>Read-only MCP server</h1>
      <p className="lede">
        An AI client that speaks the Model Context Protocol (MCP) can read my public resume text through this endpoint. It has three tools. None of them can change anything.
      </p>
      <p>
        The endpoint takes JSON-RPC 2.0 messages over HTTP POST and answers with JSON. It reads the same text as the chat assistant on this site, through the same read-only database role, and every text it returns passes the chat&apos;s link, private-word and format guards.
      </p>

      <section className="numbered-section" aria-labelledby="mcp-connect">
        <p className="card-num">01</p>
        <h2 id="mcp-connect">Connect</h2>
        <p>
          Endpoint: <code className="mcp-url">{url}</code>
        </p>
        <p>Protocol version 2025-06-18. List the tools:</p>
        <pre className="mcp-code">
          <code>{list}</code>
        </pre>
        <p>Call one:</p>
        <pre className="mcp-code">
          <code>{call}</code>
        </pre>
      </section>

      <section className="numbered-section" aria-labelledby="mcp-tools">
        <p className="card-num">02</p>
        <h2 id="mcp-tools">Tools</h2>
        {tools.map((tool) => (
          <div key={tool.name} className="mcp-tool">
            <h3>
              <code>{tool.name}</code>
            </h3>
            <p>{tool.description}</p>
            {Object.keys(tool.inputSchema.properties ?? {}).length === 0 ? (
              <p className="mcp-none">Input: none.</p>
            ) : (
              <ContractTable label="Input" schema={tool.inputSchema} />
            )}
            <ContractTable label="Output" schema={tool.outputSchema} />
          </div>
        ))}
      </section>

      <section className="numbered-section" aria-labelledby="mcp-limits">
        <p className="card-num">03</p>
        <h2 id="mcp-limits">What it does not do</h2>
        <ul>
          <li>No writes. There is no tool that stores, changes or deletes anything.</li>
          <li>No sessions. Every request stands alone, and GET and DELETE are refused.</li>
          <li>No memory. Nothing from one call is kept for the next.</li>
          <li>No answers written by a model. It returns passages of text, and the client decides what to do with them.</li>
          <li>No private notes. Text that fails those guards is left out without explanation.</li>
          <li>No extra allowance. It shares the chat assistant&apos;s rate limits, and every request counts, including listing the tools.</li>
        </ul>
      </section>
    </article>
  );
}
