import { stringEnum, unsupportedSchemaKeys } from "./schema-sanitize-rules.js";

export type Sanitized = { schema: Record<string, unknown> } | { skip: string };
type Result = { value: unknown } | { skip: string };

function hasReference(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasReference);
  if (!value || typeof value !== "object") return false;
  return "$ref" in value || Object.values(value).some(hasReference);
}

function sanitize(value: unknown): Result {
  if (Array.isArray(value)) {
    const items = value.map(sanitize);
    const skipped = items.find((item) => "skip" in item);
    return skipped ?? { value: items.map((item) => (item as { value: unknown }).value) };
  }
  if (!value || typeof value !== "object") return { value };
  const input = value as Record<string, unknown>;
  if ("$ref" in input) return { skip: "Schema references are unsupported" };
  const output: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(input)) {
    if (unsupportedSchemaKeys.has(key)) continue;
    if (key === "anyOf" || key === "oneOf") {
      if (!Array.isArray(child)) return { skip: `${key} schemas are unsupported` };
      const values = child.map(stringEnum);
      if (values.some((item) => !item)) return { skip: `${key} schemas are unsupported` };
      output.type = "string";
      output.enum = [...new Set(values.flat())];
      continue;
    }
    const result = sanitize(child);
    if ("skip" in result) return result;
    output[key] = result.value;
  }
  return { value: output };
}

export function sanitizeInputSchema(input: Record<string, unknown>): Sanitized {
  try {
    if (hasReference(input)) return { skip: "Schema references are unsupported" };
    const result = sanitize(input);
    if ("skip" in result) return result;
    const schema = result.value as Record<string, unknown>;
    if (!schema.type) schema.type = Array.isArray(schema.enum) ? "string" : "object";
    return { schema };
  } catch {
    return { skip: "Schema sanitization failed" };
  }
}
