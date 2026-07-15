import { readFileSync } from "node:fs";
import { expandEnv } from "../domain/env-expand.js";
import type { RawMcpConfig, RawServer } from "../domain/config-types.js";
import type { ConfigSourcePort } from "../application/ports.js";
import { configPaths, type ConfigPaths } from "./paths.js";
export class ConfigLoader implements ConfigSourcePort {
  readonly warnings: string[] = [];
  constructor(
    private readonly pathsFor = configPaths,
    private readonly env = process.env,
  ) {}
  loadSources(cwd: string, projectTrusted: boolean): RawMcpConfig[] {
    const paths = this.pathsFor(cwd);
    const selected = [
      paths.userMcp,
      paths.agentMcp,
      ...(projectTrusted ? [paths.projectMcp, paths.projectPiMcp] : []),
    ];
    return selected.flatMap((path) => this.read(path));
  }
  private read(path: string): RawMcpConfig[] {
    try {
      return [this.expand(JSON.parse(readFileSync(path, "utf8")) as RawMcpConfig)];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT")
        this.warnings.push(`${path}: ${error instanceof Error ? error.message : error}`);
      return [];
    }
  }
  private expand(config: RawMcpConfig): RawMcpConfig {
    const mcpServers = Object.fromEntries(
      Object.entries(config.mcpServers ?? {}).map(([name, raw]) => [name, this.expandEntry(raw)]),
    );
    return { ...config, mcpServers };
  }
  private expandEntry(raw: RawServer): RawServer {
    const value = JSON.stringify(raw);
    const expanded = expandEnv(
      value,
      Object.fromEntries(
        Object.entries(this.env).filter(
          (entry): entry is [string, string] => entry[1] !== undefined,
        ),
      ),
    );
    this.warnings.push(...expanded.warnings);
    return JSON.parse(expanded.value) as RawServer;
  }
}
export type { ConfigPaths };
