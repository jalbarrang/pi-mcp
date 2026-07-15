import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { ConnectionManager } from "./application/manager.js";
import { createSyncState, syncTools, type SyncState } from "./application/sync-tools.js";
import { mergeCatalogs } from "./domain/config-merge.js";
import type { Catalog, McpConnectionPort } from "./application/ports.js";
import { BrowserOpen } from "./infrastructure/browser-open.js";
import { CallbackServer } from "./infrastructure/callback-server.js";
import { ConfigLoader } from "./infrastructure/config-loader.js";
import { CredentialStore } from "./infrastructure/credential-store.js";
import { HttpConnection, type OAuthSessionFactory } from "./infrastructure/http-connection.js";
import { createOAuthSession } from "./infrastructure/oauth-session.js";
import { PiRegistry } from "./infrastructure/pi-registry.js";
import { SdkConnection } from "./infrastructure/sdk-connection.js";

export default function mcpExtension(pi: ExtensionAPI) {
  const loader = new ConfigLoader();
  const store = new CredentialStore();
  let notify = (_url: URL) => {};
  const createSession: OAuthSessionFactory = (spec, signal) =>
    createOAuthSession(
      spec.name,
      new CallbackServer(spec.oauthPort),
      store,
      new BrowserOpen((command, args) => pi.exec(command, args)),
      notify,
      signal,
    );
  const manager = new ConnectionManager((spec) =>
    spec.kind === "stdio" ? new SdkConnection() : new HttpConnection(createSession),
  );
  const registry = new PiRegistry(pi);
  const syncStates = new Map<string, SyncState>();
  const syncServer = (name: string, connection: McpConnectionPort, catalog: Catalog) => {
    const spec = catalog.get(name)!;
    const state = syncStates.get(name) ?? createSyncState();
    syncStates.set(name, state);
    return syncTools(name, connection, registry, state, spec.includeTools, spec.excludeTools);
  };
  pi.on("session_start", async (_event, ctx) => {
    notify = (url) => ctx.ui.notify(`Open this authorization URL in a browser: ${url}`, "info");
    const { catalog, errors } = mergeCatalogs(loader.loadSources(ctx.cwd, ctx.isProjectTrusted()));
    await manager.startAll(catalog);
    const ready = [...manager.connections].filter(([, connection]) => connection.state === "ready");
    const results = await Promise.all(
      ready.map(([name, connection]) => {
        connection.onToolsChanged?.(() => {
          void syncServer(name, connection, catalog);
        });
        return syncServer(name, connection, catalog);
      }),
    );
    const tools = results.reduce((count, result) => count + result.registered.length, 0);
    const states = [...manager.connections].reduce(
      (all, [, connection]) => ({ ...all, [connection.state]: (all[connection.state] ?? 0) + 1 }),
      {} as Record<string, number>,
    );
    const auth = states["needs-auth"]
      ? `; ${states["needs-auth"]} needs-auth (will authorize on first use)`
      : "";
    const notices = [...errors, ...loader.warnings, ...manager.notices];
    ctx.ui.notify(
      `MCP: ${states.ready ?? 0} ready, ${states.failed ?? 0} failed${auth}; ${tools} tools${notices.length ? `; ${notices.join("; ")}` : ""}`,
      "info",
    );
  });
  pi.on("session_shutdown", async () => {
    await manager.stopAll();
  });
}
