import { mapContent } from "../domain/result-map.js";
import type { McpConnectionPort } from "./ports.js";
export async function callTool(connection: McpConnectionPort, name: string, args: unknown, signal?: AbortSignal) {
  const result = await connection.callTool(name, args, signal);
  const content = mapContent(result.content);
  if (result.isError) throw new Error(content.map((block) => block.type === "text" ? block.text : "[image]").join("\n"));
  return content;
}
