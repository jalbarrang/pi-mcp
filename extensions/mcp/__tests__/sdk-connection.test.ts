import { expect, test } from "bun:test";
import { resolve } from "node:path";
import { SdkConnection } from "../infrastructure/sdk-connection.js";
test("connects to a stdio MCP server and maps errors", async () => {
  const connection = new SdkConnection();
  await connection.connect({ name: "echo", kind: "stdio", command: process.execPath, args: [resolve(import.meta.dir, "fixtures/echo-stdio.ts")], env: {}, enabled: true, lazy: false });
  expect((await connection.listTools()).map((tool) => tool.name)).toContain("echo");
  expect((await connection.callTool("echo", { message: "hi" })).content).toMatchObject([{ text: "hi" }]);
  expect((await connection.callTool("fail", {})).isError).toBe(true);
  await connection.close();
});
