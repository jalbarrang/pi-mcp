import { sanitizeInputSchema } from "../domain/schema-sanitize.js";
import { ToolCatalog } from "../domain/tool-catalog.js";
import { applyFilters } from "../domain/tool-filter.js";
import { bridgeToolName } from "../domain/tool-name.js";
import type { McpConnectionPort } from "./ports.js";
import { createSyncState } from "./sync-tools.js";

export async function syncCatalog(
  server: string,
  connection: McpConnectionPort,
  catalog: ToolCatalog,
  state = createSyncState(),
  include?: string[],
  exclude?: string[],
) {
  const skipped: { tool: string; reason: string }[] = [];
  for (const tool of applyFilters(await connection.listTools(), include, exclude)) {
    if (state.names.has(tool.name)) continue;
    const sanitized = sanitizeInputSchema(tool.inputSchema);
    if ("skip" in sanitized) {
      skipped.push({ tool: tool.name, reason: sanitized.skip });
      continue;
    }
    const bridgedName = bridgeToolName(server, tool.name, state.taken);
    state.names.set(tool.name, bridgedName);
    state.taken.add(bridgedName);
    catalog.add({ ...tool, server, bridgedName, schema: sanitized.schema });
  }
  return { tools: catalog.list(server), skipped, state };
}
