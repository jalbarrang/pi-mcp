import type { ConnectionFactory, McpConnectionPort, ServerSpec } from "./ports.js";
export interface ConnectResult {
  connection: McpConnectionPort;
  error?: string;
}
export async function connectServer(
  spec: ServerSpec,
  factory: ConnectionFactory,
): Promise<ConnectResult> {
  const connection = factory(spec);
  try {
    await connection.connect(spec);
    return { connection };
  } catch (error) {
    return { connection, error: error instanceof Error ? error.message : String(error) };
  }
}
