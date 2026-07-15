export type RawServer = Record<string, unknown>;

export interface RawMcpConfig {
  mcpServers?: Record<string, RawServer>;
}

export interface SharedServerSpec {
  name: string;
  enabled: boolean;
  lazy: boolean;
  includeTools?: string[];
  excludeTools?: string[];
}

export interface StdioServerSpec extends SharedServerSpec {
  kind: "stdio";
  command: string;
  args: string[];
  env: Record<string, string>;
  cwd?: string;
}

export interface RemoteServerSpec extends SharedServerSpec {
  kind: "http" | "sse";
  url: string;
  headers: Record<string, string>;
}

export type ServerSpec = StdioServerSpec | RemoteServerSpec;
export type Catalog = Map<string, ServerSpec>;
