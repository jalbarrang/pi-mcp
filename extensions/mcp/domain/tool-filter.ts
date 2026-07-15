import type { RemoteTool } from "./tool-types.js";

export function applyFilters(tools: RemoteTool[], include?: string[], exclude?: string[]): RemoteTool[] {
  return tools.filter((tool) => (!include || include.includes(tool.name)) && !exclude?.includes(tool.name));
}
