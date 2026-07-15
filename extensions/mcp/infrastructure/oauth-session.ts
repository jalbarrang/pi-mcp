import type {
  AuthorizationAttemptPort,
  BrowserPort,
  CallbackServerPort,
  CredentialStorePort,
} from "../application/ports.js";
import { OAuthProvider } from "./oauth-provider.js";

export interface OAuthSession {
  provider: OAuthProvider;
  attempt: AuthorizationAttemptPort;
}

export async function createOAuthSession(
  server: string,
  callback: CallbackServerPort,
  store: CredentialStorePort,
  browser: BrowserPort,
  surfaceUrl: (url: URL) => void,
  signal: AbortSignal,
): Promise<OAuthSession> {
  const session = await callback.start(signal);
  const provider = new OAuthProvider(server, session.redirectUrl, store, browser, surfaceUrl);
  return {
    provider,
    attempt: {
      waitForCode: (waitSignal) => session.waitForCode(provider.stateValue, waitSignal),
      close: () => session.close(),
    },
  };
}
