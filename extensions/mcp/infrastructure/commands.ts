import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { authorizeServer } from "../application/authorize-server.js";
import type { CredentialStorePort, Catalog } from "../application/ports.js";
import type { ConnectionManager } from "../application/manager.js";
import { ToolCatalog } from "../domain/tool-catalog.js";

type Runtime = {
  catalog: () => Catalog;
  manager: ConnectionManager;
  tools: ToolCatalog;
  store?: CredentialStorePort;
  connect: (name: string) => Promise<void>;
  reload: () => Promise<string>;
};
const subcommands = ["status", "connect", "disconnect", "tools", "reload", "auth"];
const words = (values: string[]) => values.map((value) => ({ value, label: value }));
const message = (ctx: { hasUI: boolean; ui: { notify(text: string, type: "info" | "warning"): void } }, text: string, type: "info" | "warning" = "info") => { if (ctx.hasUI) ctx.ui.notify(text, type); };

export function registerMcpCommand(pi: ExtensionAPI, runtime: Runtime) {
  pi.registerCommand("mcp", {
    description: "Manage MCP servers",
    getArgumentCompletions(prefix) {
      const [command] = prefix.trim().split(/\s+/);
      if (!command || !prefix.includes(" ")) return words(subcommands);
      if (["connect", "disconnect", "tools"].includes(command)) return words([...runtime.catalog().keys()]);
      return command === "auth" ? words(["reset"]) : null;
    },
    async handler(args, ctx) {
      const [command = "status", name, target] = args.trim().split(/\s+/);
      if (command === "status") {
        const lines = [...runtime.catalog().values()].map((spec) => {
          const connection = runtime.manager.connections.get(spec.name);
          return `${spec.name} ${spec.kind} ${spec.lazy ? "lazy" : "direct"} ${connection?.state ?? "idle"} ${runtime.tools.list(spec.name).length} tools`;
        });
        return message(ctx, lines.join("\n") || "MCP: no configured servers");
      }
      if (command === "connect" && name) return connectAndAuthorize(runtime, name).then(() => message(ctx, `MCP: ${name} connected`));
      if (command === "disconnect" && name) {
        await runtime.manager.disconnect(name);
        return message(ctx, `MCP: ${name} disconnected`);
      }
      if (command === "tools" && name) return message(ctx, runtime.tools.list(name).map((tool) => tool.bridgedName).join("\n") || `MCP: no tools for ${name}`);
      if (command === "reload") return runtime.reload().then((text) => message(ctx, text));
      if (command === "auth" && name === "reset" && target) {
        if (!runtime.store) return message(ctx, "MCP: credential storage is unavailable", "warning");
        await runtime.store.clear(target);
        await runtime.manager.disconnect(target);
        return message(ctx, `MCP: credentials reset for ${target}`);
      }
      message(ctx, "Usage: /mcp [status|connect <server>|disconnect <server>|tools <server>|reload|auth reset <server>]", "warning");
    },
  });
}

export async function connectAndAuthorize(runtime: Runtime, name: string) {
  const connection = await runtime.manager.ensureConnected(name);
  if (connection.state === "needs-auth") await authorizeServer(connection, new AbortController().signal);
  await runtime.connect(name);
}
