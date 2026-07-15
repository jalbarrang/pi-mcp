import { createServer } from "node:http";
import type { CallbackServerPort } from "../application/ports.js";

export class CallbackServer implements CallbackServerPort {
  constructor(private readonly port = 0, private readonly timeout = 300_000) {}
  waitForCode(expectedState: string, signal: AbortSignal): Promise<string> {
    return new Promise((resolve, reject) => {
      const server = createServer((request, response) => {
        const url = new URL(request.url ?? "/", "http://127.0.0.1");
        if (url.searchParams.get("state") !== expectedState || !url.searchParams.get("code")) {
          response.writeHead(400).end("Invalid authorization callback");
          done(new Error("Authorization callback validation failed"));
          return;
        }
        response.writeHead(200, { "content-type": "text/html" }).end("You can close this tab.");
        done(undefined, url.searchParams.get("code")!);
      });
      const timer = setTimeout(() => done(new Error("Authorization timed out")), this.timeout);
      const abort = () => done(new Error("Authorization cancelled"));
      const done = (error?: Error, code?: string) => {
        clearTimeout(timer);
        signal.removeEventListener("abort", abort);
        server.close();
        if (error) reject(error); else resolve(code!);
      };
      signal.addEventListener("abort", abort, { once: true });
      server.listen(this.port, "127.0.0.1");
    });
  }
}
