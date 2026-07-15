import { chmod, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { CredentialStorePort, StoredCredential } from "../application/ports.js";

export class CredentialStore implements CredentialStorePort {
  readonly warnings: string[] = [];
  constructor(private readonly directory = join(process.env.PI_CODING_AGENT_DIR ?? join(homedir(), ".pi", "agent"), "mcp-auth")) {}
  async load(serverName: string): Promise<StoredCredential | undefined> {
    try {
      return JSON.parse(await readFile(this.path(serverName), "utf8")) as StoredCredential;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") this.warnings.push(`${serverName}: unreadable credentials`);
      return undefined;
    }
  }
  async save(serverName: string, credential: StoredCredential) {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    await chmod(this.directory, 0o700);
    const path = this.path(serverName);
    await writeFile(path, JSON.stringify(credential), { mode: 0o600 });
    await chmod(path, 0o600);
  }
  async clear(serverName: string) {
    try { await unlink(this.path(serverName)); } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  private path(serverName: string) {
    return join(this.directory, `${encodeURIComponent(serverName)}.json`);
  }
}
