import { expect, test } from "bun:test";
import { DEFAULT_MAX_BYTES } from "@earendil-works/pi-coding-agent";
import { PiRegistry } from "../infrastructure/pi-registry.js";
import type { PiContent } from "../domain/tool-types.js";

test("caps aggregate text output and adds a truncation notice", async () => {
  let execute!: (_id: string, args: unknown) => Promise<{ content: PiContent[] }>;
  const pi = { registerTool: (tool: { execute: typeof execute }) => (execute = tool.execute) };
  new PiRegistry(pi as never).register(
    { name: "tool", server: "server", bridgedName: "server_tool", inputSchema: {}, schema: {} },
    async () =>
      Array.from({ length: 3 }, () => ({ type: "text" as const, text: `${"x".repeat(20_000)}\n` })),
  );
  const content = (await execute("id", {})).content;
  const text = content.filter((block) => block.type === "text").map((block) => block.text);
  expect(Buffer.byteLength(text.join(""), "utf8")).toBeLessThanOrEqual(DEFAULT_MAX_BYTES);
  expect(text.at(-1)).toBe("[MCP output truncated]");
});
