import { expect, test } from "vitest";
import { createServer } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { HttpConnection } from "../infrastructure/http-connection.js";

const start = async () => {
  const http = createServer(async (request, response) => {
    const server = new McpServer({ name: "test", version: "1" });
    server.registerTool("echo", { inputSchema: {} }, () => ({
      content: [{ type: "text", text: "ok" }],
    }));
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await server.connect(transport);
    await transport.handleRequest(request, response);
  });
  await new Promise<void>((resolve) => http.listen(0, "127.0.0.1", resolve));
  const address = http.address();
  return { http, url: `http://127.0.0.1:${(address as { port: number }).port}/mcp` };
};

test("connects to a Streamable HTTP MCP server", async () => {
  const fixture = await start();
  const connection = new HttpConnection();
  await connection.connect({
    name: "echo",
    kind: "http",
    url: fixture.url,
    headers: {},
    enabled: true,
    lazy: false,
  });
  expect((await connection.listTools()).map((tool) => tool.name)).toEqual(["echo"]);
  expect((await connection.callTool("echo", {})).content[0]).toEqual({ type: "text", text: "ok" });
  await connection.close();
  await new Promise<void>((resolve) => fixture.http.close(() => resolve()));
});

test("retries a 4xx HTTP initialization with SSE", async () => {
  const methods: string[] = [];
  const server = createServer((request, response) => {
    methods.push(request.method!);
    response.writeHead(404).end();
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as { port: number }).port;
  await expect(
    new HttpConnection().connect({
      name: "old",
      kind: "http",
      url: `http://127.0.0.1:${port}`,
      headers: {},
      enabled: true,
      lazy: false,
    }),
  ).rejects.toThrow();
  expect(methods).toEqual(["POST", "GET"]);
  await new Promise<void>((resolve) => server.close(() => resolve()));
});
