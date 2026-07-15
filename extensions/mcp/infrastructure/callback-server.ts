import { createServer, type Server } from "node:http";
import type { CallbackServerPort, CallbackSessionPort } from "../application/ports.js";

export class CallbackServer implements CallbackServerPort {
  constructor(
    private readonly port = 0,
    private readonly timeout = 300_000,
  ) {}
  async start(): Promise<CallbackSessionPort> {
    let server: Server;
    let expectedState = "";
    let settle: ((error?: Error, code?: string) => void) | undefined;
    server = createServer((request, response) => {
      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      if (url.searchParams.get("state") !== expectedState || !url.searchParams.get("code")) {
        response.writeHead(400).end("Invalid authorization callback");
        settle?.(new Error("Authorization callback validation failed"));
        return;
      }
      response.writeHead(200, { "content-type": "text/html" }).end("You can close this tab.");
      settle?.(undefined, url.searchParams.get("code")!);
    });
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject).listen(this.port, "127.0.0.1", resolve);
    });
    const address = server.address() as { port: number };
    return {
      redirectUrl: `http://127.0.0.1:${address.port}/callback`,
      waitForCode: (state, signal) =>
        new Promise((resolve, reject) => {
          expectedState = state;
          const timer = setTimeout(() => done(new Error("Authorization timed out")), this.timeout);
          const abort = () => done(new Error("Authorization cancelled"));
          const done = (error?: Error, code?: string) => {
            clearTimeout(timer);
            signal.removeEventListener("abort", abort);
            server.close();
            settle = undefined;
            if (error) reject(error);
            else resolve(code!);
          };
          settle = done;
          signal.addEventListener("abort", abort, { once: true });
        }),
      close: async () => {
        server.close();
      },
    };
  }
}
