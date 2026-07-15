import { parseServer } from "./config-parse.js";
import type { Catalog, RawMcpConfig } from "./config-types.js";

export interface MergedCatalog {
  catalog: Catalog;
  errors: string[];
}

export function mergeCatalogs(sources: RawMcpConfig[]): MergedCatalog {
  const catalog: Catalog = new Map();
  const errors: string[] = [];
  for (const source of sources) {
    for (const [name, raw] of Object.entries(source.mcpServers ?? {})) {
      const result = parseServer(name, raw);
      if ("error" in result) errors.push(result.error);
      else catalog.set(name, result);
    }
  }
  return { catalog, errors };
}
