import type { BridgedTool } from "./tool-types.js";

export interface CatalogEntry extends BridgedTool {
  skipped?: string;
}

export class ToolCatalog {
  private readonly tools = new Map<string, Map<string, CatalogEntry>>();

  set(server: string, entries: CatalogEntry[]) {
    const indexed = new Map<string, CatalogEntry>();
    for (const entry of entries) indexed.set(entry.bridgedName, entry);
    this.tools.set(server, indexed);
  }

  add(entry: CatalogEntry) {
    const server = this.tools.get(entry.server) ?? new Map<string, CatalogEntry>();
    server.set(entry.bridgedName, entry);
    this.tools.set(entry.server, server);
  }

  find(server: string, bridgedName: string) {
    return this.tools.get(server)?.get(bridgedName);
  }

  list(server: string) {
    return [...(this.tools.get(server)?.values() ?? [])];
  }

  servers() {
    return [...this.tools.keys()];
  }
}
