import { callTool } from "./call-tool.js";
import type { Catalog, McpConnectionPort } from "./ports.js";
import { renderToolHelp } from "../domain/describe-render.js";
import { ToolCatalog } from "../domain/tool-catalog.js";
import type { ConnectionManager } from "./manager.js";

export type GatewayAction = "list" | "describe" | "call";
export interface GatewayRequest {
  action: GatewayAction;
  server?: string;
  tool?: string;
  args?: string;
}
export type SyncLazyTools = (name: string, connection: McpConnectionPort) => Promise<void>;

export function createGateway(
  manager: ConnectionManager,
  catalog: Catalog,
  tools: ToolCatalog,
  sync: SyncLazyTools,
) {
  async function ready(name: string) {
    const spec = catalog.get(name);
    if (!spec?.lazy) throw new Error(`Unknown lazy MCP server: ${name}`);
    const connection = await manager.ensureConnected(name);
    if (connection.state === "needs-auth")
      throw new Error(`${name} needs authorization; run /mcp connect ${name}`);
    if (connection.state !== "ready") throw new Error(`${name} is ${connection.state}`);
    await sync(name, connection);
    return connection;
  }

  return async (request: GatewayRequest, signal?: AbortSignal): Promise<string> => {
    if (request.action === "list" && !request.server)
      return [...catalog.values()]
        .filter((spec) => spec.lazy)
        .map((spec) => `${spec.name}: ${manager.connections.get(spec.name)?.state ?? "idle"}`)
        .join("\n");
    if (!request.server) throw new Error("server is required");
    const connection = await ready(request.server);
    if (request.action === "list")
      return tools.list(request.server).map((tool) => `${tool.bridgedName}: ${tool.description ?? ""}`).join("\n");
    if (!request.tool) throw new Error("tool is required");
    const tool = tools.find(request.server, request.tool);
    if (!tool) throw new Error(`Unknown tool ${request.tool} on ${request.server}`);
    if (request.action === "describe") return renderToolHelp(tool);
    let args: unknown = {};
    if (request.args) {
      try {
        args = JSON.parse(request.args);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Invalid args JSON: ${message}. args must be a JSON string.`);
      }
    }
    const content = await callTool(connection, tool.name, args, signal);
    return content.map((block) => (block.type === "text" ? block.text : "[image]")).join("\n");
  };
}
