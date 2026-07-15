import { expect, test } from "bun:test";
import { authorizeServer } from "../application/authorize-server.js";
import type { McpConnectionPort } from "../application/ports.js";

const unauthorized = () => Object.assign(new Error("required"), { name: "UnauthorizedError" });
class FakeConnection implements McpConnectionPort {
  state = "needs-auth" as const;
  retries = 0;
  finished = 0;
  wait: () => Promise<string> = async () => "code";
  async connect() {}
  async retryConnection() { if (++this.retries < 3) throw unauthorized(); this.state = "ready" as never; }
  async beginAuthorization() { return { waitForCode: () => this.wait(), close: async () => {} }; }
  isAuthorizationError(error: unknown) { return error instanceof Error && error.name === "UnauthorizedError"; }
  async finishAuth() { this.finished++; }
  async listTools() { return []; }
  async callTool() { return { content: [], isError: false }; }
  async close() {}
}
test("authorizes, exchanges the callback code, and reconnects", async () => {
  const connection = new FakeConnection();
  await authorizeServer(connection, new AbortController().signal);
  expect([connection.finished, connection.retries, connection.state] as (number | string)[]).toEqual([1, 3, "ready"]);
});
test("shares one authorization for concurrent callers", async () => {
  const connection = new FakeConnection();
  let release!: () => void;
  connection.wait = () => new Promise((resolve) => { release = () => resolve("code"); });
  const first = authorizeServer(connection, new AbortController().signal);
  const second = authorizeServer(connection, new AbortController().signal);
  await new Promise((resolve) => setTimeout(resolve, 0));
  release();
  await Promise.all([first, second]);
  expect(connection.finished).toBe(1);
});
test("masks callback timeout details", async () => {
  const connection = new FakeConnection();
  connection.wait = async () => { throw new Error("Authorization timed out"); };
  await expect(authorizeServer(connection, new AbortController().signal)).rejects.toThrow("Authorization failed");
});
