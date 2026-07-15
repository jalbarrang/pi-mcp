import { expect, test } from "bun:test";
import { callTool } from "../application/call-tool.js";
import { ConnectionManager } from "../application/manager.js";
import type { McpConnectionPort } from "../application/ports.js";
class Fake implements McpConnectionPort { state = "ready" as const; closed = 0; async connect() {} async listTools() { return []; } async callTool() { return { content: [{ type: "text" as const, text: "bad" }], isError: true }; } async close() { this.closed++; } }
test("maps MCP errors to throws", () => expect(callTool(new Fake(), "x", {})).rejects.toThrow("bad"));
test("stops manager idempotently", async () => { const fake = new Fake(); const manager = new ConnectionManager(() => fake); manager.connections.set("x", fake); await manager.stopAll(); await manager.stopAll(); expect(fake.closed).toBe(1); });
