import { sanitizeInputSchema } from "../domain/schema-sanitize.js";
import { applyFilters } from "../domain/tool-filter.js";
import { bridgeToolName } from "../domain/tool-name.js";
import { callTool } from "./call-tool.js";
import type { McpConnectionPort, ToolRegistryPort } from "./ports.js";

export interface SyncState {
  names: Map<string, string>;
  taken: Set<string>;
}

export const createSyncState = (): SyncState => ({ names: new Map(), taken: new Set() });

export async function syncTools(
  server: string,
  connection: McpConnectionPort,
  registry: ToolRegistryPort,
  state: SyncState,
  include?: string[],
  exclude?: string[],
) {
  const registered: string[] = [];
  const kept: string[] = [];
  const skipped: { tool: string; reason: string }[] = [];
  for (const tool of applyFilters(await connection.listTools(), include, exclude)) {
    const existing = state.names.get(tool.name);
    if (existing) {
      kept.push(existing);
      continue;
    }
    const sanitized = sanitizeInputSchema(tool.inputSchema);
    if ("skip" in sanitized) {
      skipped.push({ tool: tool.name, reason: sanitized.skip });
      continue;
    }
    const bridgedName = bridgeToolName(server, tool.name, state.taken);
    state.names.set(tool.name, bridgedName);
    state.taken.add(bridgedName);
    registry.register({ ...tool, server, bridgedName, schema: sanitized.schema }, (args, signal) =>
      callTool(connection, tool.name, args, signal),
    );
    registered.push(bridgedName);
  }
  return { registered, kept, skipped };
}
