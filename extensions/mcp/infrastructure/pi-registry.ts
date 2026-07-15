import {
  DEFAULT_MAX_BYTES,
  DEFAULT_MAX_LINES,
  truncateHead,
  type ExtensionAPI,
} from "@earendil-works/pi-coding-agent";
import type { ToolRegistryPort } from "../application/ports.js";
import type { BridgedTool, PiContent } from "../domain/tool-types.js";

const truncationNotice = "[MCP output truncated]";
const bytes = (text: string) => Buffer.byteLength(text, "utf8");

function truncateContent(blocks: PiContent[]): PiContent[] {
  const content = blocks.map((block) =>
    block.type === "text"
      ? {
          ...block,
          text: truncateHead(block.text, {
            maxBytes: DEFAULT_MAX_BYTES,
            maxLines: DEFAULT_MAX_LINES,
          }).content,
        }
      : block,
  );
  let total = content.reduce(
    (sum, block) => sum + (block.type === "text" ? bytes(block.text) : 0),
    0,
  );
  if (total <= DEFAULT_MAX_BYTES) return content;
  const limit = DEFAULT_MAX_BYTES - bytes(truncationNotice);
  for (let index = content.length - 1; total > limit && index >= 0; index--) {
    const block = content[index];
    if (block.type !== "text") continue;
    const text = truncateHead(block.text, {
      maxBytes: Math.max(0, bytes(block.text) - (total - limit)),
      maxLines: DEFAULT_MAX_LINES,
    }).content;
    total += bytes(text) - bytes(block.text);
    if (text) content[index] = { ...block, text };
    else content.splice(index, 1);
  }
  return [...content, { type: "text", text: truncationNotice }];
}

export class PiRegistry implements ToolRegistryPort {
  constructor(private readonly pi: ExtensionAPI) {}
  register(tool: BridgedTool, handler: (args: unknown, signal?: AbortSignal) => Promise<unknown>) {
    this.pi.registerTool({
      name: tool.bridgedName,
      label: tool.bridgedName,
      description: `[MCP:${tool.server}] ${tool.description ?? tool.name}`,
      parameters: tool.schema as never,
      async execute(_id, args, signal) {
        return {
          content: truncateContent((await handler(args, signal)) as PiContent[]),
          details: {},
        };
      },
    });
  }
}
