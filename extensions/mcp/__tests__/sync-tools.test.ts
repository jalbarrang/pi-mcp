import { expect, test } from "vitest";
import { createSyncState, syncTools } from "../application/sync-tools.js";
import type { McpConnectionPort, ToolRegistryPort } from "../application/ports.js";
import type { BridgedTool, RemoteTool } from "../domain/tool-types.js";

const tool = (name: string): RemoteTool => ({ name, inputSchema: { type: "object" } });
class Registry implements ToolRegistryPort {
  tools: BridgedTool[] = [];
  register(tool: BridgedTool) {
    this.tools.push(tool);
  }
}
function connection(tools: RemoteTool[]): McpConnectionPort {
  return {
    state: "ready",
    async connect() {},
    async listTools() {
      return tools;
    },
    async callTool() {
      return { content: [] };
    },
    async close() {},
  };
}
test("keeps already bridged tools without registering them again", async () => {
  const registry = new Registry();
  const state = createSyncState();
  const server = connection([tool("find")]);
  const first = await syncTools("server", server, registry, state);
  const second = await syncTools("server", server, registry, state);
  expect(first.registered).toEqual(["server_find"]);
  expect(second).toEqual({ registered: [], kept: ["server_find"], skipped: [] });
  expect(registry.tools.map((item) => item.bridgedName)).toEqual(first.registered);
});
test("registers only tools added during a later sync", async () => {
  const registry = new Registry();
  const state = createSyncState();
  const tools = [tool("find")];
  const server = connection(tools);
  await syncTools("server", server, registry, state);
  tools.push(tool("read"));
  expect(await syncTools("server", server, registry, state)).toEqual({
    registered: ["server_read"],
    kept: ["server_find"],
    skipped: [],
  });
  expect(registry.tools.map((item) => item.bridgedName)).toEqual(["server_find", "server_read"]);
});
