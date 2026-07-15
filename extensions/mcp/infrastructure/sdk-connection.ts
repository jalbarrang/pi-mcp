import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { McpConnectionPort } from "../application/ports.js";
import type { ServerSpec } from "../domain/config-types.js";
import type { McpToolResult, RemoteTool } from "../domain/tool-types.js";
export class SdkConnection implements McpConnectionPort {
  state: "idle" | "connecting" | "ready" | "failed" | "closed" = "idle";
  private client?: Client;
  private transport?: StdioClientTransport;
  private changed?: () => void;
  async connect(spec: ServerSpec) {
    if (spec.kind !== "stdio") throw new Error("Only stdio is supported");
    this.state = "connecting";
    try {
      this.client = new Client(
        { name: "pi-mcp", version: "0.1.0" },
        {
          listChanged: {
            tools: {
              onChanged: (error) => {
                if (!error) this.changed?.();
              },
            },
          },
        },
      );
      this.transport = new StdioClientTransport({
        command: spec.command,
        args: spec.args,
        cwd: spec.cwd,
        env: { PATH: process.env.PATH ?? "", HOME: process.env.HOME ?? "", ...spec.env },
      });
      await this.client.connect(this.transport);
      this.state = "ready";
    } catch (error) {
      this.state = "failed";
      throw error;
    }
  }
  async listTools(): Promise<RemoteTool[]> {
    return (await this.client!.listTools()).tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema as Record<string, unknown>,
    }));
  }
  async callTool(name: string, args: unknown, signal?: AbortSignal): Promise<McpToolResult> {
    const result = await this.client!.callTool(
      { name, arguments: args as Record<string, unknown> },
      undefined,
      { signal },
    );
    return {
      content: result.content as McpToolResult["content"],
      isError: result.isError === true,
    };
  }
  onToolsChanged(handler: () => void) {
    this.changed = handler;
  }
  async close() {
    await this.transport?.close();
    this.state = "closed";
  }
}
