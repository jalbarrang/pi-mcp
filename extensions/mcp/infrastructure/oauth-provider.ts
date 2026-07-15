import { randomUUID } from "node:crypto";
import type {
  OAuthClientInformationMixed,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import type {
  OAuthClientProvider,
  OAuthDiscoveryState,
} from "@modelcontextprotocol/sdk/client/auth.js";
import type { BrowserPort, CredentialStorePort } from "../application/ports.js";

export class OAuthProvider implements OAuthClientProvider {
  readonly stateValue = randomUUID();
  constructor(
    private readonly server: string,
    private readonly callbackUrl: string,
    private readonly store: CredentialStorePort,
    private readonly browser: BrowserPort,
    private readonly surfaceUrl: (url: URL) => void,
  ) {}
  get redirectUrl() {
    return this.callbackUrl;
  }
  get clientMetadata() {
    return {
      client_name: "pi-mcp",
      redirect_uris: [this.callbackUrl],
      grant_types: ["authorization_code", "refresh_token"],
      token_endpoint_auth_method: "none",
    };
  }
  state() {
    return this.stateValue;
  }
  async clientInformation() {
    return (await this.store.load(this.server))?.clientInformation as
      | OAuthClientInformationMixed
      | undefined;
  }
  async saveClientInformation(clientInformation: OAuthClientInformationMixed) {
    await this.save({ clientInformation });
  }
  async tokens() {
    return (await this.store.load(this.server))?.tokens as OAuthTokens | undefined;
  }
  async saveTokens(tokens: OAuthTokens) {
    await this.save({ tokens });
  }
  async saveCodeVerifier(codeVerifier: string) {
    await this.save({ codeVerifier });
  }
  async codeVerifier() {
    return (await this.store.load(this.server))?.codeVerifier ?? "";
  }
  async redirectToAuthorization(url: URL) {
    try {
      await this.browser.open(url);
    } catch {
      this.surfaceUrl(url);
    }
  }
  async discoveryState() {
    return (await this.store.load(this.server))?.discoveryState as OAuthDiscoveryState | undefined;
  }
  async saveDiscoveryState(discoveryState: OAuthDiscoveryState) {
    await this.save({ discoveryState });
  }
  private async save(part: Record<string, unknown>) {
    await this.store.save(this.server, { ...(await this.store.load(this.server)), ...part });
  }
}
