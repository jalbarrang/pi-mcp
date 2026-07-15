import { StringEnum } from "@earendil-works/pi-ai";
import {
  DEFAULT_MAX_BYTES,
  DEFAULT_MAX_LINES,
  truncateHead,
  type ExtensionAPI,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import type { GatewayRequest } from "../application/gateway.js";

const parameters = Type.Object({
  action: StringEnum(["list", "describe", "call"] as const, { description: "Gateway action" }),
  server: Type.Optional(Type.String({ description: "Lazy MCP server name" })),
  tool: Type.Optional(Type.String({ description: "Bridged tool name" })),
  args: Type.Optional(Type.String({ description: "JSON string of tool arguments" })),
});

export function registerGatewayTool(
  pi: ExtensionAPI,
  gateway: (request: GatewayRequest, signal?: AbortSignal) => Promise<string>,
) {
  pi.registerTool({
    name: "mcp",
    label: "MCP Gateway",
    description: "Discover and call tools on lazy MCP servers. args must be a JSON string.",
    parameters,
    promptSnippet: "Discover and call tools on lazy MCP servers: list → describe → call",
    promptGuidelines: ['Use mcp with action "describe" before the first call to a tool.'],
    async execute(_id, request, signal) {
      const text = await gateway(request, signal);
      return {
        content: [
          {
            type: "text",
            text: truncateHead(text, { maxBytes: DEFAULT_MAX_BYTES, maxLines: DEFAULT_MAX_LINES })
              .content,
          },
        ],
        details: {},
      };
    },
  });
}
