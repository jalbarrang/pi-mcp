import type { BridgedTool } from "./tool-types.js";

type Schema = Record<string, unknown>;

const text = (value: unknown) => (typeof value === "string" ? value : undefined);

function parameter(name: string, schema: Schema, required: boolean, depth = 0): string[] {
  const prefix = `${"  ".repeat(depth)}- ${name}${required ? " (required)" : " (optional)"}`;
  const parts = [text(schema.type) ?? "value"];
  if (Array.isArray(schema.enum)) parts.push(`one of: ${schema.enum.join(", ")}`);
  if ("default" in schema) parts.push(`default: ${JSON.stringify(schema.default)}`);
  const lines = [`${prefix}: ${parts.join("; ")}`];
  if (schema.properties && typeof schema.properties === "object") {
    const requiredNames = new Set(Array.isArray(schema.required) ? schema.required : []);
    for (const [child, childSchema] of Object.entries(schema.properties as Schema))
      lines.push(...parameter(child, childSchema as Schema, requiredNames.has(child), depth + 1));
  }
  return lines;
}

export function renderToolHelp(tool: BridgedTool): string {
  const schema = tool.schema as Schema;
  const required = new Set(Array.isArray(schema.required) ? schema.required : []);
  const properties =
    schema.properties && typeof schema.properties === "object" ? schema.properties : {};
  const lines = [`${tool.bridgedName}: ${tool.description ?? tool.name}`, "Parameters:"];
  const entries = Object.entries(properties as Schema);
  if (!entries.length) lines.push("- none");
  for (const [name, property] of entries)
    lines.push(...parameter(name, property as Schema, required.has(name)));
  return lines.join("\n");
}
