import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport, StreamableHTTPError } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
import type { McpConnectionPort } from "../application/ports.js";
import type { RemoteServerSpec, ServerSpec } from "../domain/config-types.js";
import type { McpToolResult, RemoteTool } from "../domain/tool-types.js";

type RemoteTransport = StreamableHTTPClientTransport | SSEClientTransport;
export class HttpConnection implements McpConnectionPort {
  state: "idle" | "connecting" | "ready" | "needs-auth" | "failed" | "closed" = "idle";
  private client?: Client;
  private transport?: RemoteTransport;
  constructor(private readonly authProvider?: OAuthClientProvider) {}
  async connect(spec: ServerSpec) {
    if (spec.kind === "stdio") throw new Error("HTTP connection requires a remote server");
    this.state = "connecting";
    try {
      await this.connectWith(spec, spec.kind === "sse");
      this.state = "ready";
    } catch (error) {
      if (spec.kind === "http" && error instanceof StreamableHTTPError && is4xx(error)) {
        await this.connectWith(spec, true);
        this.state = "ready";
        return;
      }
      this.state = error instanceof Error && error.name === "UnauthorizedError" ? "needs-auth" : "failed";
      throw error;
    }
  }
  private async connectWith(spec: RemoteServerSpec, sse: boolean) {
    this.client = new Client({ name: "pi-mcp", version: "0.1.0" });
    const options = { authProvider: this.authProvider, requestInit: { headers: spec.headers } };
    this.transport = sse ? new SSEClientTransport(new URL(spec.url), options) :
      new StreamableHTTPClientTransport(new URL(spec.url), options);
    await this.client.connect(this.transport);
  }
  async listTools(): Promise<RemoteTool[]> {
    return (await this.client!.listTools()).tools.map((tool) => ({ name: tool.name, description: tool.description, inputSchema: tool.inputSchema as Record<string, unknown> }));
  }
  async callTool(name: string, args: unknown, signal?: AbortSignal): Promise<McpToolResult> {
    const result = await this.client!.callTool({ name, arguments: args as Record<string, unknown> }, undefined, { signal });
    return { content: result.content as McpToolResult["content"], isError: result.isError === true };
  }
  async finishAuth(code: string) {
    await this.transport?.finishAuth(code);
  }
  async close() {
    await this.transport?.close();
    this.state = "closed";
  }
}
const is4xx = (error: StreamableHTTPError) => !!error.code && error.code >= 400 && error.code < 500;
