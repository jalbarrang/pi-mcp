import { expect, test } from "vitest";
import { connectAndAuthorize } from "../infrastructure/commands.js";
import { ConnectionManager } from "../application/manager.js";
import { diffCatalogs } from "../application/reload-diff.js";
import { ToolCatalog } from "../domain/tool-catalog.js";
import type { McpConnectionPort, ServerSpec } from "../application/ports.js";

const spec: ServerSpec = {
  name: "remote",
  kind: "http",
  url: "https://x",
  headers: {},
  enabled: true,
  lazy: true,
};
class AuthFake implements McpConnectionPort {
  state = "idle" as "idle" | "needs-auth" | "ready";
  authorizations = 0;
  syncs = 0;
  retries = 0;
  async connect() {
    this.state = "needs-auth";
  }
  async retryConnection() {
    if (++this.retries < 3) throw new Error("auth");
    this.state = "ready";
  }
  async beginAuthorization() {
    this.authorizations++;
    return { waitForCode: async () => "code", close: async () => {} };
  }
  async finishAuth() {}
  isAuthorizationError() {
    return true;
  }
  async listTools() {
    return [];
  }
  async callTool() {
    return { content: [] };
  }
  async close() {}
}
test("connect command authorizes a needs-auth server before syncing", async () => {
  const fake = new AuthFake();
  const manager = new ConnectionManager(() => fake);
  await manager.startAll(new Map([[spec.name, spec]]));
  const runtime = {
    catalog: () => new Map([[spec.name, spec]]),
    manager,
    tools: new ToolCatalog(),
    connect: async () => {
      fake.syncs++;
    },
    reload: async () => "",
  };
  await connectAndAuthorize(runtime, "remote");
  expect(fake.authorizations).toBe(1);
  expect(fake.syncs).toBe(1);
  expect(fake.state).toBe("ready");
});
test("reload diff reports add, changed, removed, and unchanged entries", () => {
  const unchanged = { ...spec, name: "same" };
  const changed = { ...spec, name: "changed" };
  const result = diffCatalogs(
    new Map([
      ["same", unchanged],
      ["changed", changed],
      ["removed", spec],
    ]),
    new Map([
      ["same", unchanged],
      ["changed", { ...changed, lazy: false }],
      ["added", spec],
    ]),
  );
  expect(result).toEqual({
    added: ["added"],
    changed: ["changed"],
    removed: ["removed"],
    unchanged: ["same"],
  });
});
