import { homedir } from "node:os";
import { join } from "node:path";
export interface ConfigPaths {
  userMcp: string;
  agentMcp: string;
  projectMcp: string;
  projectPiMcp: string;
}
export function configPaths(
  cwd: string,
  home = homedir(),
  agentDir = process.env.PI_CODING_AGENT_DIR ?? join(home, ".pi", "agent"),
): ConfigPaths {
  return {
    userMcp: join(home, ".config", "mcp", "mcp.json"),
    agentMcp: join(agentDir, "mcp.json"),
    projectMcp: join(cwd, ".mcp.json"),
    projectPiMcp: join(cwd, ".pi", "mcp.json"),
  };
}
