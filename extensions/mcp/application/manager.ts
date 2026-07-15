import type { Catalog, ConnectionFactory, McpConnectionPort } from "./ports.js";
import { connectServer } from "./connect-server.js";
export class ConnectionManager {
  readonly connections = new Map<string, McpConnectionPort>();
  readonly notices: string[] = [];
  constructor(private readonly factory: ConnectionFactory) {}
  async startAll(catalog: Catalog) {
    for (const spec of catalog.values()) {
      if (!spec.enabled) continue;
      if (spec.lazy || spec.kind !== "stdio") {
        this.notices.push(`${spec.name}: deferred (remote/lazy support pending)`);
        continue;
      }
      const result = await connectServer(spec, this.factory);
      if (result.error) this.notices.push(`${spec.name}: ${result.error}`);
      else this.connections.set(spec.name, result.connection);
    }
  }
  async stopAll() {
    await Promise.all([...this.connections.values()].map((connection) => connection.close()));
    this.connections.clear();
  }
}
