import type { BrowserPort } from "../application/ports.js";

type Exec = (command: string, args: string[]) => Promise<{ code: number }>;
export class BrowserOpen implements BrowserPort {
  constructor(
    private readonly exec: Exec,
    private readonly platform = process.platform,
  ) {}
  async open(url: URL) {
    const [command, args] =
      this.platform === "darwin"
        ? ["open", [url.href]]
        : this.platform === "win32"
          ? ["start", [url.href]]
          : ["xdg-open", [url.href]];
    const result = await this.exec(command, args);
    if (result.code !== 0) throw new Error("Could not open authorization browser");
  }
}
