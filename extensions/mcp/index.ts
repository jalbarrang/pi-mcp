import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { createGateway } from "./application/gateway.js";
import { ConnectionManager } from "./application/manager.js";
import type { Catalog } from "./application/ports.js";
import { diffCatalogs } from "./application/reload-diff.js";
import { buildSummaryLine, stateCounts } from "./application/summary.js";
import { createSyncers } from "./application/syncers.js";
import { mergeCatalogs } from "./domain/config-merge.js";
import { ToolCatalog } from "./domain/tool-catalog.js";
import { registerMcpCommand } from "./infrastructure/commands.js";
import { ConfigLoader } from "./infrastructure/config-loader.js";
import { CredentialStore } from "./infrastructure/credential-store.js";
import { registerGatewayTool } from "./infrastructure/gateway-tool.js";
import { HttpConnection } from "./infrastructure/http-connection.js";
import { createSessionFactory } from "./infrastructure/oauth-wiring.js";
import { PiRegistry } from "./infrastructure/pi-registry.js";
import { SdkConnection } from "./infrastructure/sdk-connection.js";
import { renderWidgetLine } from "./infrastructure/widget.js";

export default function mcpExtension(pi: ExtensionAPI) {
  const loader = new ConfigLoader();
  const store = new CredentialStore();
  let notify = (_url: URL) => {};
  const session = createSessionFactory(
    store,
    (command, args) => pi.exec(command, args),
    (url) => notify(url),
  );
  const manager = new ConnectionManager((spec) =>
    spec.kind === "stdio" ? new SdkConnection() : new HttpConnection(session),
  );
  const tools = new ToolCatalog();
  let active: Catalog = new Map();
  const getActive = () => active;
  const syncers = createSyncers(new PiRegistry(pi), tools, getActive);
  let registered = false;

  pi.on("session_start", async (_event, ctx) => {
    notify = (url) => {
      if (ctx.hasUI) ctx.ui.notify(`Open this authorization URL in a browser: ${url}`, "info");
    };
    const loadCatalog = () => mergeCatalogs(loader.loadSources(ctx.cwd, ctx.isProjectTrusted()));
    const { catalog, errors } = loadCatalog();
    active = catalog;
    const updateWidget = () => {
      if (!ctx.hasUI) return;
      const line = active.size
        ? [renderWidgetLine(manager.connections, tools, active.size)]
        : undefined;
      ctx.ui.setWidget("mcp", line);
    };
    await manager.startAll(catalog);
    if (!registered) {
      registered = true;
      if ([...catalog.values()].some((spec) => spec.lazy))
        registerGatewayTool(pi, createGateway(manager, getActive, tools, syncers.syncLazy));
      registerMcpCommand(pi, {
        catalog: getActive,
        manager,
        tools,
        store,
        connect: async (name) => {
          const connection = await manager.ensureConnected(name);
          await syncers.syncLazy(name, connection);
          if (!getActive().get(name)!.lazy) await syncers.syncDirect(name, connection);
        },
        reload: async () => {
          const next = loadCatalog().catalog;
          const diff = diffCatalogs(active, next);
          active = next;
          await manager.startAll(next);
          return `MCP reload: ${diff.added.length} added, ${diff.changed.length} changed, ${diff.removed.length} removed, ${diff.unchanged.length} unchanged`;
        },
        updated: updateWidget,
      });
    }
    const ready = [...manager.connections].filter(([, c]) => c.state === "ready");
    const results = await Promise.all(
      ready.map(([name, connection]) => {
        connection.onToolsChanged?.(() => void syncers.syncDirect(name, connection));
        return syncers.syncDirect(name, connection);
      }),
    );
    const count = results.reduce((total, result) => total + result.registered.length, 0);
    updateWidget();
    const lazyCount = [...catalog.values()].filter((spec) => spec.lazy).length;
    const notices = [...errors, ...loader.warnings, ...manager.notices];
    if (ctx.hasUI)
      ctx.ui.notify(
        buildSummaryLine(stateCounts(manager.connections), lazyCount, count, notices),
        "info",
      );
  });

  pi.on("session_shutdown", async () => {
    await manager.stopAll();
  });
}
