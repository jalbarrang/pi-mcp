import {
  DEFAULT_MAX_BYTES,
  DEFAULT_MAX_LINES,
  truncateHead,
  type ExtensionAPI,
} from "@earendil-works/pi-coding-agent";
import type { ToolRegistryPort } from "../application/ports.js";
import type { BridgedTool, PiContent } from "../domain/tool-types.js";
export class PiRegistry implements ToolRegistryPort {
  constructor(private readonly pi: ExtensionAPI) {}
  register(tool: BridgedTool, handler: (args: unknown, signal?: AbortSignal) => Promise<unknown>) {
    this.pi.registerTool({
      name: tool.bridgedName,
      label: tool.bridgedName,
      description: `[MCP:${tool.server}] ${tool.description ?? tool.name}`,
      parameters: tool.schema as never,
      async execute(_id, args, signal) {
        const content = ((await handler(args, signal)) as PiContent[]).map(
          (block): PiContent =>
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
        return { content, details: {} };
      },
    });
  }
}
