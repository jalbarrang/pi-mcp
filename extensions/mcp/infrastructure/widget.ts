import type { McpConnectionPort } from "../application/ports.js";
import { ToolCatalog } from "../domain/tool-catalog.js";

export function renderWidgetLine(
  connections: Iterable<[string, McpConnectionPort]>,
  tools: ToolCatalog,
  serverCount: number,
) {
  const states = [...connections].reduce(
    (all, [, connection]) => {
      all[connection.state] = (all[connection.state] ?? 0) + 1;
      return all;
    },
    {} as Record<string, number>,
  );
  const totalTools = tools
    .servers()
    .reduce((total, server) => total + tools.list(server).length, 0);
  const parts = [`MCP: ${serverCount} servers`, `${totalTools} tools`];
  if (states["needs-auth"]) parts.push(`${states["needs-auth"]} needs auth`);
  if (states.failed) parts.push(`${states.failed} failed`);
  return parts.join(" · ");
}
