import type { Catalog, ConnectionFactory, McpConnectionPort } from "./ports.js";
import { connectServer } from "./connect-server.js";

export class ConnectionManager {
  readonly connections = new Map<string, McpConnectionPort>();
  readonly notices: string[] = [];
  private readonly specs = new Map();
  private readonly pending = new Map<string, Promise<McpConnectionPort>>();

  constructor(private readonly factory: ConnectionFactory) {}

  async startAll(catalog: Catalog) {
    for (const spec of catalog.values()) {
      this.specs.set(spec.name, spec);
      if (!spec.enabled || spec.lazy) continue;
      try {
        await this.connect(spec.name);
      } catch {
        // The connection failure is retained as a notice for the session summary.
      }
    }
  }

  ensureConnected(name: string) {
    const connection = this.connections.get(name);
    if (connection && connection.state !== "closed") return Promise.resolve(connection);
    const pending = this.pending.get(name);
    if (pending) return pending;
    const connecting = this.connect(name).finally(() => this.pending.delete(name));
    this.pending.set(name, connecting);
    return connecting;
  }

  private async connect(name: string) {
    const spec = this.specs.get(name);
    if (!spec || !spec.enabled) throw new Error(`Unknown or disabled MCP server: ${name}`);
    const result = await connectServer(spec, this.factory);
    this.connections.set(name, result.connection);
    if (result.error && result.connection.state !== "needs-auth") {
      this.notices.push(`${name}: ${result.error}`);
      throw new Error(`${name}: ${result.error}`);
    }
    return result.connection;
  }

  async stopAll() {
    const connections = [...this.connections];
    connections.forEach(([, connection]) => connection.abortAuthorization?.());
    const results = await Promise.allSettled(connections.map(([, connection]) => connection.close()));
    this.connections.clear();
    for (const [index, result] of results.entries()) {
      if (result.status === "rejected") {
        const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
        this.notices.push(`${connections[index][0]}: failed to close (${reason})`);
      }
    }
  }
}
