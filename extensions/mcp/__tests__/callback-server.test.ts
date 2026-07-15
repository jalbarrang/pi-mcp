import { expect, test } from "bun:test";
import { get } from "node:http";
import { CallbackServer } from "../infrastructure/callback-server.js";

const request = (url: string) => new Promise<number>((resolve, reject) => {
  const req = get(url, (res) => { res.resume(); res.on("end", () => resolve(res.statusCode!)); });
  req.on("error", reject);
});

test("accepts one valid authorization callback", async () => {
  const controller = new AbortController();
  const session = await new CallbackServer().start();
  const code = session.waitForCode("state", controller.signal);
  expect(await request(`${session.redirectUrl}?state=state&code=code`)).toBe(200);
  expect(await code).toBe("code");
});

test("rejects a mismatched callback state", async () => {
  const controller = new AbortController();
  const session = await new CallbackServer().start();
  const code = session.waitForCode("state", controller.signal).catch((error) => error);
  expect(await request(`${session.redirectUrl}?state=wrong&code=code`)).toBe(400);
  expect((await code).message).toContain("validation");
});
