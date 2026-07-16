import { expect, test } from "vitest";
import { mkdtemp, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CredentialStore } from "../infrastructure/credential-store.js";

test("stores credentials privately and clears only one server", async () => {
  const directory = await mkdtemp(join(tmpdir(), "pi-mcp-"));
  const store = new CredentialStore(directory);
  await store.save("one", { tokens: { access_token: "secret" } });
  await store.save("two", { tokens: { access_token: "other" } });
  expect(await store.load("one")).toEqual({ tokens: { access_token: "secret" } });
  expect((await stat(join(directory, "one.json"))).mode & 0o077).toBe(0);
  await store.clear("one");
  expect(await store.load("one")).toBeUndefined();
  expect(await store.load("two")).toEqual({ tokens: { access_token: "other" } });
});
