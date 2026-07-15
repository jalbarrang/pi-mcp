import type { Catalog, RawMcpConfig, ServerSpec } from "../domain/config-types.js";
import type { BridgedTool, McpToolResult, RemoteTool } from "../domain/tool-types.js";
export type ConnectionState = "idle" | "connecting" | "ready" | "failed" | "closed";
export interface McpConnectionPort {
  readonly state: ConnectionState;
  connect(spec: ServerSpec): Promise<void>;
  listTools(): Promise<RemoteTool[]>;
  callTool(name: string, args: unknown, signal?: AbortSignal): Promise<McpToolResult>;
  onToolsChanged?(handler: () => void): void;
  close(): Promise<void>;
}
export interface ToolRegistryPort {
  register(
    tool: BridgedTool,
    handler: (args: unknown, signal?: AbortSignal) => Promise<unknown>,
  ): void;
}
export interface ConfigSourcePort {
  loadSources(cwd: string, projectTrusted: boolean): RawMcpConfig[];
}
export type ConnectionFactory = () => McpConnectionPort;
export interface NoticeSink {
  notices: string[];
}
export type { Catalog, ServerSpec, BridgedTool };
