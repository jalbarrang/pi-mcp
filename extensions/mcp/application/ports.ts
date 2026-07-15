import type { Catalog, RawMcpConfig, ServerSpec } from "../domain/config-types.js";
import type { ConnectionState } from "../domain/connection-state.js";
import type { BridgedTool, McpToolResult, RemoteTool } from "../domain/tool-types.js";
export type { ConnectionState } from "../domain/connection-state.js";
export interface McpConnectionPort {
  readonly state: ConnectionState;
  connect(spec: ServerSpec): Promise<void>;
  listTools(): Promise<RemoteTool[]>;
  callTool(name: string, args: unknown, signal?: AbortSignal): Promise<McpToolResult>;
  onToolsChanged?(handler: () => void): void;
  finishAuth?(code: string): Promise<void>;
  retryConnection?(): Promise<void>;
  beginAuthorization?(signal: AbortSignal): Promise<AuthorizationAttemptPort>;
  isAuthorizationError?(error: unknown): boolean;
  abortAuthorization?(): void;
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
export type ConnectionFactory = (spec: ServerSpec) => McpConnectionPort;
export interface NoticeSink {
  notices: string[];
}
export interface BrowserPort {
  open(url: URL): Promise<void>;
}
export interface CallbackSessionPort {
  redirectUrl: string;
  waitForCode(state: string, signal: AbortSignal): Promise<string>;
  close(): Promise<void>;
}
export interface CallbackServerPort {
  start(signal: AbortSignal): Promise<CallbackSessionPort>;
}
export interface AuthorizationAttemptPort {
  waitForCode(signal: AbortSignal): Promise<string>;
  close(): Promise<void>;
}
export interface StoredCredential {
  tokens?: Record<string, unknown>;
  clientInformation?: Record<string, unknown>;
  codeVerifier?: string;
  discoveryState?: Record<string, unknown>;
}
export interface CredentialStorePort {
  load(serverName: string): Promise<StoredCredential | undefined>;
  save(serverName: string, credential: StoredCredential): Promise<void>;
  clear(serverName: string): Promise<void>;
}
export type { Catalog, ServerSpec, BridgedTool };
