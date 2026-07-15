import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { ConnectionManager } from "./application/manager.js";
import { createSyncState, syncTools, type SyncState } from "./application/sync-tools.js";
import { mergeCatalogs } from "./domain/config-merge.js";
import type { Catalog, McpConnectionPort } from "./application/ports.js";
import { ConfigLoader } from "./infrastructure/config-loader.js";
import { PiRegistry } from "./infrastructure/pi-registry.js";
import { SdkConnection } from "./infrastructure/sdk-connection.js";

export default function mcpExtension(pi: ExtensionAPI) {
  const loader = new ConfigLoader();
  const manager = new ConnectionManager(() => new SdkConnection());
  const registry = new PiRegistry(pi);
  const syncStates = new Map<string, SyncState>();
  const syncServer = (name: string, connection: McpConnectionPort, catalog: Catalog) => {
    const spec = catalog.get(name)!;
    const state = syncStates.get(name) ?? createSyncState();
    syncStates.set(name, state);
    return syncTools(name, connection, registry, state, spec.includeTools, spec.excludeTools);
  };
  pi.on("session_start", async (_event, ctx) => {
    const { catalog, errors } = mergeCatalogs(loader.loadSources(ctx.cwd, ctx.isProjectTrusted()));
    await manager.startAll(catalog);
    const results = await Promise.all(
      [...manager.connections].map(([name, connection]) => {
        connection.onToolsChanged?.(() => {
          void syncServer(name, connection, catalog);
        });
        return syncServer(name, connection, catalog);
      }),
    );
    const tools = results.reduce((count, result) => count + result.registered.length, 0);
    const notices = [...errors, ...loader.warnings, ...manager.notices];
    ctx.ui.notify(
      `MCP: ${manager.connections.size} servers, ${tools} tools${notices.length ? `; ${notices.join("; ")}` : ""}`,
      "info",
    );
  });
  pi.on("session_shutdown", async () => manager.stopAll());
}
