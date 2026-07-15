import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { createGateway } from "./application/gateway.js";
import { ConnectionManager } from "./application/manager.js";
import { syncCatalog } from "./application/sync-catalog.js";
import { createSyncState, syncTools, type SyncState } from "./application/sync-tools.js";
import type { Catalog, McpConnectionPort } from "./application/ports.js";
import { mergeCatalogs } from "./domain/config-merge.js";
import { ToolCatalog } from "./domain/tool-catalog.js";
import { BrowserOpen } from "./infrastructure/browser-open.js";
import { CallbackServer } from "./infrastructure/callback-server.js";
import { ConfigLoader } from "./infrastructure/config-loader.js";
import { CredentialStore } from "./infrastructure/credential-store.js";
import { registerGatewayTool } from "./infrastructure/gateway-tool.js";
import { HttpConnection, type OAuthSessionFactory } from "./infrastructure/http-connection.js";
import { createOAuthSession } from "./infrastructure/oauth-session.js";
import { PiRegistry } from "./infrastructure/pi-registry.js";
import { SdkConnection } from "./infrastructure/sdk-connection.js";

export default function mcpExtension(pi: ExtensionAPI) {
  const loader = new ConfigLoader();
  const store = new CredentialStore();
  let notify = (_url: URL) => {};
  const session: OAuthSessionFactory = (spec, signal) => createOAuthSession(spec.name, new CallbackServer(spec.oauthPort), store, new BrowserOpen((command, args) => pi.exec(command, args)), notify, signal);
  const manager = new ConnectionManager((spec) => spec.kind === "stdio" ? new SdkConnection() : new HttpConnection(session));
  const registry = new PiRegistry(pi);
  const tools = new ToolCatalog();
  const direct = new Map<string, SyncState>();
  const lazy = new Map<string, SyncState>();
  let gatewayRegistered = false;
  pi.on("session_start", async (_event, ctx) => {
    notify = (url) => { if (ctx.hasUI) ctx.ui.notify(`Open this authorization URL in a browser: ${url}`, "info"); };
    const { catalog, errors } = mergeCatalogs(loader.loadSources(ctx.cwd, ctx.isProjectTrusted()));
    const syncDirect = (name: string, connection: McpConnectionPort, source = catalog) => {
      const spec = source.get(name)!;
      const state = direct.get(name) ?? createSyncState();
      direct.set(name, state);
      return syncTools(name, connection, registry, state, spec.includeTools, spec.excludeTools);
    };
    const syncLazy = async (name: string, connection: McpConnectionPort) => {
      const spec = catalog.get(name)!;
      const result = await syncCatalog(name, connection, tools, lazy.get(name), spec.includeTools, spec.excludeTools);
      lazy.set(name, result.state);
    };
    await manager.startAll(catalog);
    if (!gatewayRegistered && [...catalog.values()].some((spec) => spec.lazy)) {
      registerGatewayTool(pi, createGateway(manager, catalog, tools, syncLazy));
      gatewayRegistered = true;
    }
    const ready = [...manager.connections].filter(([, connection]) => connection.state === "ready");
    const results = await Promise.all(ready.map(([name, connection]) => {
      connection.onToolsChanged?.(() => { void syncDirect(name, connection); });
      return syncDirect(name, connection);
    }));
    const count = results.reduce((total, result) => total + result.registered.length, 0);
    const states = [...manager.connections].reduce((all, [, connection]) => ({ ...all, [connection.state]: (all[connection.state] ?? 0) + 1 }), {} as Record<string, number>);
    const auth = states["needs-auth"] ? `; ${states["needs-auth"]} needs-auth (run /mcp connect <name> to authorize)` : "";
    const lazyCount = [...catalog.values()].filter((spec) => spec.lazy).length;
    const notices = [...errors, ...loader.warnings, ...manager.notices];
    if (ctx.hasUI) ctx.ui.notify(`MCP: ${states.ready ?? 0} ready, ${states.failed ?? 0} failed${lazyCount ? `; ${lazyCount} lazy (on-demand)` : ""}${auth}; ${count} tools${notices.length ? `; ${notices.join("; ")}` : ""}`, "info");
  });
  pi.on("session_shutdown", async () => { await manager.stopAll(); });
}
