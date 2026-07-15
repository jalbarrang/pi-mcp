import { syncCatalog } from "./sync-catalog.js";
import { createSyncState, syncTools, type SyncState } from "./sync-tools.js";
import type { Catalog, McpConnectionPort, ToolRegistryPort } from "./ports.js";
import type { ToolCatalog } from "../domain/tool-catalog.js";

/** Session-persistent sync orchestration for direct and lazy servers. */
export function createSyncers(
  registry: ToolRegistryPort,
  tools: ToolCatalog,
  getActive: () => Catalog,
) {
  const direct = new Map<string, SyncState>();
  const lazy = new Map<string, SyncState>();

  const syncDirect = (name: string, connection: McpConnectionPort) => {
    const spec = getActive().get(name)!;
    const state = direct.get(name) ?? createSyncState();
    direct.set(name, state);
    return syncTools(name, connection, registry, state, spec.includeTools, spec.excludeTools);
  };

  const syncLazy = async (name: string, connection: McpConnectionPort) => {
    const spec = getActive().get(name)!;
    const result = await syncCatalog(
      name,
      connection,
      tools,
      lazy.get(name),
      spec.includeTools,
      spec.excludeTools,
    );
    lazy.set(name, result.state);
  };

  return { syncDirect, syncLazy };
}
