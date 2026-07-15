export interface RemoteTool {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}
export interface BridgedTool extends RemoteTool {
  server: string;
  bridgedName: string;
  schema: Record<string, unknown>;
}
export interface McpToolResult {
  content: McpContent[];
  isError?: boolean;
}
export type McpContent =
  | { type: "text"; text: string }
  | { type: "image"; data: string; mimeType: string }
  | Record<string, unknown>;
export type PiContent =
  | { type: "text"; text: string }
  | { type: "image"; data: string; mimeType: string };
