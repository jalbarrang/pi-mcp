import type { McpContent, PiContent } from "./tool-types.js";

export function mapContent(content: McpContent[]): PiContent[] {
  return content.map((block) => {
    if (block.type === "text") return { type: "text", text: String(block.text) };
    if (block.type === "image") return { type: "image", data: String(block.data), mimeType: String(block.mimeType) };
    return { type: "text", text: JSON.stringify(block) };
  });
}
