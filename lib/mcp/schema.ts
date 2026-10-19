// A tiny JSON Schema subset, enough for the three tools: objects with string properties,
// strict (no extra keys). Written by hand so the server needs no validation library.
// The same objects are sent to clients in tools/list and rendered on the /mcp page.

export type JsonSchema = {
  type: "object" | "string" | "number" | "array";
  description?: string;
  properties?: Record<string, JsonSchema>;
  required?: readonly string[];
  additionalProperties?: false;
  items?: JsonSchema;
  enum?: readonly string[];
  minLength?: number;
  maxLength?: number;
};

export type Validation = { ok: true; value: Record<string, unknown> } | { ok: false; message: string };

// Validates tool arguments against an object schema. Messages name fields only and
// never echo the caller's values.
export function validateArguments(schema: JsonSchema, input: unknown): Validation {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, message: "Arguments must be an object." };
  }
  const args = input as Record<string, unknown>;
  const props = schema.properties ?? {};
  for (const key of Object.keys(args)) {
    if (!Object.prototype.hasOwnProperty.call(props, key)) return { ok: false, message: "Unknown argument." };
  }
  for (const key of schema.required ?? []) {
    if (!(key in args)) return { ok: false, message: `Missing argument: ${key}.` };
  }
  for (const [key, rule] of Object.entries(props)) {
    if (!(key in args)) continue;
    const v = args[key];
    if (rule.type === "string") {
      if (typeof v !== "string") return { ok: false, message: `Argument ${key} must be a string.` };
      if (rule.minLength !== undefined && v.length < rule.minLength) return { ok: false, message: `Argument ${key} is too short.` };
      if (rule.maxLength !== undefined && v.length > rule.maxLength) return { ok: false, message: `Argument ${key} is too long.` };
      if (rule.enum && !rule.enum.includes(v)) return { ok: false, message: `Argument ${key} is not one of the allowed values.` };
    } else {
      return { ok: false, message: `Argument ${key} has an unsupported type.` };
    }
  }
  return { ok: true, value: args };
}

export type SchemaRow = { path: string; type: string; required: boolean; description: string; constraints: string };

// Flattens a schema into table rows for the docs page: "passages[].section", and so on.
export function schemaRows(schema: JsonSchema, prefix = "", required = true): SchemaRow[] {
  const rows: SchemaRow[] = [];
  const constraints = [
    schema.minLength !== undefined || schema.maxLength !== undefined
      ? `${schema.minLength ?? 0} to ${schema.maxLength ?? "any"} characters`
      : "",
    schema.enum ? `one of ${schema.enum.length} values` : "",
  ].filter(Boolean).join(", ");
  if (schema.type === "object") {
    for (const [key, child] of Object.entries(schema.properties ?? {})) {
      const path = prefix ? `${prefix}.${key}` : key;
      rows.push(...schemaRows(child, path, (schema.required ?? []).includes(key)));
    }
  } else if (schema.type === "array" && schema.items) {
    const path = `${prefix}[]`;
    rows.push({ path: prefix, type: "array", required, description: schema.description ?? "", constraints: "" });
    rows.push(...schemaRows(schema.items, path, true));
  } else {
    rows.push({ path: prefix, type: schema.type, required, description: schema.description ?? "", constraints });
  }
  return rows;
}
