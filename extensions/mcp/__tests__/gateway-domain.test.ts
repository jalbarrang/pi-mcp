import { expect, test } from "bun:test";
import { renderToolHelp } from "../domain/describe-render.js";
import { ToolCatalog } from "../domain/tool-catalog.js";
import type { BridgedTool } from "../domain/tool-types.js";

const tool = (bridgedName: string): BridgedTool => ({
  name: "find",
  bridgedName,
  server: "alpha",
  description: "Find records",
  inputSchema: {},
  schema: {
    type: "object",
    required: ["query"],
    properties: {
      query: { type: "string" },
      mode: { type: "string", enum: ["fast", "full"], default: "fast" },
      filters: { type: "object", properties: { limit: { type: "number" } } },
    },
  },
});

test("renders required, optional, enum, default, and nested parameters", () => {
  expect(renderToolHelp(tool("alpha_find"))).toBe(
    "alpha_find: Find records\nParameters:\n- query (required): string\n- mode (optional): string; one of: fast, full; default: \"fast\"\n- filters (optional): object\n  - limit (optional): number",
  );
});

test("catalog replaces a bridged-name collision within one server", () => {
  const catalog = new ToolCatalog();
  catalog.add(tool("alpha_find"));
  catalog.add({ ...tool("alpha_find"), description: "New description" });
  expect(catalog.list("alpha")).toHaveLength(1);
  expect(catalog.find("alpha", "alpha_find")?.description).toBe("New description");
});
