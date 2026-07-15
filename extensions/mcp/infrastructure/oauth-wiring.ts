import type { CredentialStorePort } from "../application/ports.js";
import { BrowserOpen } from "./browser-open.js";
import { CallbackServer } from "./callback-server.js";
import type { OAuthSessionFactory } from "./http-connection.js";
import { createOAuthSession } from "./oauth-session.js";

type Exec = (command: string, args: string[]) => Promise<{ code: number }>;

export function createSessionFactory(
  store: CredentialStorePort,
  exec: Exec,
  surfaceUrl: (url: URL) => void,
): OAuthSessionFactory {
  return (spec, signal) =>
    createOAuthSession(
      spec.name,
      new CallbackServer(spec.oauthPort),
      store,
      new BrowserOpen(exec),
      surfaceUrl,
      signal,
    );
}
