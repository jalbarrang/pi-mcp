import { expect, test } from "bun:test";
import { ToolCatalog } from "../domain/tool-catalog.js";
import { renderWidgetLine } from "../infrastructure/widget.js";
import type { McpConnectionPort } from "../application/ports.js";

const tools = new ToolCatalog();
test("renders only nonzero state segments", () => {
  tools.add({ name: "find", bridgedName: "one_find", server: "one", inputSchema: {}, schema: {} });
  const connections = new Map<string, McpConnectionPort>([[
    "one",
    { state: "needs-auth", connect: async () => {}, listTools: async () => [], callTool: async () => ({ content: [] }), close: async () => {} },
  ]]);
  expect(renderWidgetLine(connections, tools, 2)).toBe("MCP: 2 servers · 1 tools · 1 needs auth");
});
test("omits zero tool and failure segments", () => {
  expect(renderWidgetLine(new Map(), new ToolCatalog(), 1)).toBe("MCP: 1 servers · 0 tools");
});
