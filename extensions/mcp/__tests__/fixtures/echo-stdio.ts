import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
const server = new McpServer({ name: "echo", version: "1.0.0" });
server.registerTool("echo", { inputSchema: { message: z.string() } }, (args) => ({
  content: [{ type: "text", text: args.message }],
}));
server.registerTool("fail", {}, () => ({
  content: [{ type: "text", text: "failed" }],
  isError: true,
}));
await server.connect(new StdioServerTransport());
