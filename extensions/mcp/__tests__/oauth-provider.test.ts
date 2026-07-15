import { expect, test } from "bun:test";
import { OAuthProvider } from "../infrastructure/oauth-provider.js";

const values = new Map<string, Record<string, unknown>>();
const store = {
  load: async (name: string) => values.get(name),
  save: async (name: string, value: Record<string, unknown>) => {
    values.set(name, value);
  },
  clear: async () => {},
};
test("persists OAuth material and opens the authorization URL", async () => {
  const opened: URL[] = [];
  const provider = new OAuthProvider(
    "server",
    "http://127.0.0.1:1/callback",
    store,
    {
      open: async (url) => {
        opened.push(url);
      },
    },
    () => {},
  );
  await provider.saveTokens({ access_token: "secret", token_type: "Bearer" });
  await provider.saveCodeVerifier("verifier");
  await provider.redirectToAuthorization(new URL("https://auth.example/authorize"));
  expect(provider.clientMetadata).toMatchObject({
    client_name: "pi-mcp",
    token_endpoint_auth_method: "none",
  });
  expect([await provider.codeVerifier(), opened[0].hostname]).toEqual(["verifier", "auth.example"]);
});
test("surfaces the URL when opening a browser fails", async () => {
  let surfaced = "";
  const provider = new OAuthProvider(
    "fallback",
    "http://127.0.0.1:1/callback",
    store,
    {
      open: async () => {
        throw new Error("no browser");
      },
    },
    (url) => {
      surfaced = url.href;
    },
  );
  await provider.redirectToAuthorization(new URL("https://auth.example/authorize"));
  expect(surfaced).toBe("https://auth.example/authorize");
});
