// JSON-RPC 2.0 for the read-only MCP server (MCP Streamable HTTP, stateless, JSON replies).
// Pure: no HTTP, no rate limiting. The route (app/api/mcp/route.ts) does those first.
import { toolDefinitions, ToolError, type ToolContext, type ToolDefinition } from "./tools";
import { validateArguments } from "./schema";

export const PROTOCOL_VERSION = "2025-06-18";
const SUPPORTED_VERSIONS = [PROTOCOL_VERSION, "2025-03-26", "2024-11-05"];
export const SERVER_INFO = { name: "portfolio-readonly", version: "1.0.0" };

export const PARSE_ERROR = -32700;
export const INVALID_REQUEST = -32600;
export const METHOD_NOT_FOUND = -32601;
export const INVALID_PARAMS = -32602;

type Id = string | number;
type Reply = { jsonrpc: "2.0"; id: Id | null } & ({ result: unknown } | { error: { code: number; message: string } });

// `reply` is null for notifications and client responses: the route answers 202 with no body.
// `status` is the HTTP status for the reply.
export type RpcOutcome = { status: number; reply: Reply | null };

export function rpcError(id: Id | null, code: number, message: string, status = 200): RpcOutcome {
  return { status, reply: { jsonrpc: "2.0", id, error: { code, message } } };
}

function ok(id: Id, result: unknown): RpcOutcome {
  return { status: 200, reply: { jsonrpc: "2.0", id, result } };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function listed(tool: ToolDefinition) {
  return { name: tool.name, description: tool.description, inputSchema: tool.inputSchema, outputSchema: tool.outputSchema };
}

function toolText(output: unknown): string {
  return JSON.stringify(output);
}

async function callTool(id: Id, params: unknown, ctx: ToolContext): Promise<RpcOutcome> {
  if (!isObject(params) || typeof params.name !== "string") return rpcError(id, INVALID_PARAMS, "Invalid params.");
  const tool = toolDefinitions().find((t) => t.name === params.name);
  if (!tool) return rpcError(id, INVALID_PARAMS, "Unknown tool.");
  const args = params.arguments === undefined ? {} : params.arguments;
  const checked = validateArguments(tool.inputSchema, args);
  if (!checked.ok) return rpcError(id, INVALID_PARAMS, checked.message);
  try {
    const output = await tool.run(checked.value, ctx);
    return ok(id, { content: [{ type: "text", text: toolText(output) }], structuredContent: output, isError: false });
  } catch (err) {
    // Only our own ToolError messages are shown. Everything else (database, embedding,
    // configuration) becomes one generic message and nothing about internals.
    const message = err instanceof ToolError ? err.message : "The tool is not available right now.";
    return ok(id, { content: [{ type: "text", text: message }], isError: true });
  }
}

export async function handleRpc(body: unknown, ctx: ToolContext): Promise<RpcOutcome> {
  if (Array.isArray(body)) return rpcError(null, INVALID_REQUEST, "Batch requests are not supported.", 400);
  if (!isObject(body) || body.jsonrpc !== "2.0") return rpcError(null, INVALID_REQUEST, "Invalid request.", 400);

  const hasMethod = typeof body.method === "string";
  // A response from the client (to a server request we never send): accepted, ignored.
  if (!hasMethod && ("result" in body || "error" in body)) return { status: 202, reply: null };
  if (!hasMethod) return rpcError(null, INVALID_REQUEST, "Invalid request.", 400);

  const hasId = "id" in body;
  if (hasId && typeof body.id !== "string" && typeof body.id !== "number") {
    return rpcError(null, INVALID_REQUEST, "Invalid request.", 400);
  }
  if ("params" in body && body.params !== undefined && !isObject(body.params)) {
    return rpcError(hasId ? (body.id as Id) : null, INVALID_REQUEST, "Invalid request.", 400);
  }
  // Notifications get no reply, whatever they are.
  if (!hasId) return { status: 202, reply: null };

  const id = body.id as Id;
  const params = body.params;
  switch (body.method) {
    case "initialize": {
      const asked = isObject(params) && typeof params.protocolVersion === "string" ? params.protocolVersion : "";
      return ok(id, {
        protocolVersion: SUPPORTED_VERSIONS.includes(asked) ? asked : PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      });
    }
    case "ping":
      return ok(id, {});
    case "tools/list":
      return ok(id, { tools: toolDefinitions().map(listed) });
    case "tools/call":
      return callTool(id, params, ctx);
    default:
      return rpcError(id, METHOD_NOT_FOUND, "Method not found.");
  }
}
