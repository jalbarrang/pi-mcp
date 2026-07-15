import type { McpConnectionPort } from "./ports.js";

export function stateCounts(connections: Map<string, McpConnectionPort>) {
  const counts: Record<string, number> = {};
  for (const connection of connections.values())
    counts[connection.state] = (counts[connection.state] ?? 0) + 1;
  return counts;
}

export function buildSummaryLine(
  states: Record<string, number>,
  lazyCount: number,
  toolCount: number,
  notices: string[],
) {
  const lazy = lazyCount ? `; ${lazyCount} lazy (on-demand)` : "";
  const auth = states["needs-auth"]
    ? `; ${states["needs-auth"]} needs-auth (run /mcp connect <name> to authorize)`
    : "";
  const tail = notices.length ? `; ${notices.join("; ")}` : "";
  return `MCP: ${states.ready ?? 0} ready, ${states.failed ?? 0} failed${lazy}${auth}; ${toolCount} tools${tail}`;
}
