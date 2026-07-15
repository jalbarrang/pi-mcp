export const unsupportedSchemaKeys = new Set([
  "$schema",
  "patternProperties",
  "allOf",
  "if",
  "then",
  "else",
  "definitions",
  "$defs",
]);

export function stringEnum(value: unknown): string[] | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  const schema = value as Record<string, unknown>;
  if (typeof schema.const === "string") return [schema.const];
  if (!Array.isArray(schema.enum) || !schema.enum.every((item) => typeof item === "string")) return;
  if (schema.type !== undefined && schema.type !== "string") return;
  return schema.enum;
}
