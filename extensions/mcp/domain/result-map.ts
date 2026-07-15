import type { McpContent, PiContent } from "./tool-types.js";

export function mapContent(content: McpContent[]): PiContent[] {
  return content.map((block) => {
    if (block.type === "text") return { type: "text", text: block.text };
    if (block.type === "image") return { type: "image", data: block.data, mimeType: block.mimeType };
    return { type: "text", text: JSON.stringify(block) };
  });
}
