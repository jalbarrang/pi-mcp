import type { Catalog, ConnectionFactory, McpConnectionPort } from "./ports.js";
import { connectServer } from "./connect-server.js";
export class ConnectionManager {
  readonly connections = new Map<string, McpConnectionPort>();
  readonly notices: string[] = [];
  constructor(private readonly factory: ConnectionFactory) {}
  async startAll(catalog: Catalog) {
    for (const spec of catalog.values()) {
      if (!spec.enabled) continue;
      if (spec.lazy) {
        this.notices.push(`${spec.name}: deferred (lazy support pending)`);
        continue;
      }
      const result = await connectServer(spec, this.factory);
      this.connections.set(spec.name, result.connection);
      if (result.error && result.connection.state !== "needs-auth")
        this.notices.push(`${spec.name}: ${result.error}`);
    }
  }
  async stopAll() {
    const connections = [...this.connections];
    connections.forEach(([, connection]) => connection.abortAuthorization?.());
    const results = await Promise.allSettled(
      connections.map(([, connection]) => connection.close()),
    );
    this.connections.clear();
    for (const [index, result] of results.entries()) {
      if (result.status === "rejected") {
        const reason =
          result.reason instanceof Error ? result.reason.message : String(result.reason);
        this.notices.push(`${connections[index][0]}: failed to close (${reason})`);
      }
    }
  }
}
