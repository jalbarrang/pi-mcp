export type Sanitized = { schema: Record<string, unknown> } | { skip: string };
const unsupported = new Set([
  "patternProperties",
  "allOf",
  "if",
  "then",
  "else",
  "definitions",
  "$defs",
]);

export function sanitizeInputSchema(input: Record<string, unknown>): Sanitized {
  if ("$ref" in input) return { skip: "Schema references are unsupported" };
  const schema: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input))
    if (key !== "$schema" && !unsupported.has(key)) schema[key] = value;
  if (!schema.type) schema.type = Array.isArray(schema.enum) ? "string" : "object";
  return { schema };
}
