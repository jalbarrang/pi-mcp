import { expect, test } from "bun:test";
import { createGateway } from "../application/gateway.js";
import { ConnectionManager } from "../application/manager.js";
import { syncCatalog } from "../application/sync-catalog.js";
import type { McpConnectionPort, ServerSpec } from "../application/ports.js";
import { ToolCatalog } from "../domain/tool-catalog.js";

class Fake implements McpConnectionPort {
  state = "idle" as "idle" | "ready";
  connects = 0;
  calls: unknown[] = [];
  async connect() {
    this.connects++;
    this.state = "ready";
  }
  async listTools() {
    return [
      {
        name: "echo",
        description: "Echo text",
        inputSchema: { type: "object", properties: { text: { type: "string" } } },
      },
    ];
  }
  async callTool(_name: string, args: unknown) {
    this.calls.push(args);
    return { content: [{ type: "text" as const, text: "ok" }] };
  }
  async close() {}
}

const spec: ServerSpec = {
  name: "lazy",
  kind: "stdio",
  command: "x",
  args: [],
  env: {},
  enabled: true,
  lazy: true,
};
async function gateway() {
  const fake = new Fake();
  const manager = new ConnectionManager(() => fake);
  const catalog = new Map([[spec.name, spec]]);
  await manager.startAll(catalog);
  const tools = new ToolCatalog();
  const states = new Map();
  const use = createGateway(
    manager,
    () => catalog,
    tools,
    (name, connection) => {
      const state = states.get(name);
      return syncCatalog(name, connection, tools, state).then((result) => {
        states.set(name, result.state);
      });
    },
  );
  return { fake, use };
}

test("lists lazy servers without connecting", async () => {
  const { fake, use } = await gateway();
  expect(await use({ action: "list" })).toBe("lazy: idle");
  expect(fake.connects).toBe(0);
});
test("shares one in-flight lazy connection", async () => {
  const { fake, use } = await gateway();
  await Promise.all([
    use({ action: "list", server: "lazy" }),
    use({ action: "list", server: "lazy" }),
  ]);
  expect(fake.connects).toBe(1);
});
test("connects once, describes, and calls cataloged tools", async () => {
  const { fake, use } = await gateway();
  expect(await use({ action: "list", server: "lazy" })).toContain("lazy_echo");
  expect(await use({ action: "describe", server: "lazy", tool: "lazy_echo" })).toContain(
    "text (optional)",
  );
  expect(
    await use({ action: "call", server: "lazy", tool: "lazy_echo", args: '{"text":"hi"}' }),
  ).toBe("ok");
  expect(fake.connects).toBe(1);
  expect(fake.calls).toEqual([{ text: "hi" }]);
});
test("rejects malformed gateway JSON args", async () => {
  const { use } = await gateway();
  expect(use({ action: "call", server: "lazy", tool: "lazy_echo", args: "no" })).rejects.toThrow(
    "args must be a JSON string",
  );
});
