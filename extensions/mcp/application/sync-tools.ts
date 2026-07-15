import { sanitizeInputSchema } from "../domain/schema-sanitize.js";
import { applyFilters } from "../domain/tool-filter.js";
import { bridgeToolName } from "../domain/tool-name.js";
import type { McpConnectionPort, ToolRegistryPort } from "./ports.js";
import { callTool } from "./call-tool.js";
export async function syncTools(
  server: string,
  connection: McpConnectionPort,
  registry: ToolRegistryPort,
  include?: string[],
  exclude?: string[],
) {
  const registered: string[] = [];
  const skipped: { tool: string; reason: string }[] = [];
  const taken = new Set<string>();
  for (const tool of applyFilters(await connection.listTools(), include, exclude)) {
    const sanitized = sanitizeInputSchema(tool.inputSchema);
    if ("skip" in sanitized) {
      skipped.push({ tool: tool.name, reason: sanitized.skip });
      continue;
    }
    const bridgedName = bridgeToolName(server, tool.name, taken);
    taken.add(bridgedName);
    registry.register({ ...tool, server, bridgedName, schema: sanitized.schema }, (args, signal) =>
      callTool(connection, tool.name, args, signal),
    );
    registered.push(bridgedName);
  }
  return { registered, skipped };
}
