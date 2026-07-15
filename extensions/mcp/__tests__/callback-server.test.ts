import { expect, test } from "bun:test";
import { get } from "node:http";
import { CallbackServer } from "../infrastructure/callback-server.js";

const request = (port: number, path: string) => new Promise<number>((resolve, reject) => {
  const req = get(`http://127.0.0.1:${port}${path}`, (res) => {
    res.resume();
    res.on("end", () => resolve(res.statusCode!));
  });
  req.on("error", reject);
});

test("accepts one valid authorization callback", async () => {
  const controller = new AbortController();
  const port = 18_000 + Math.floor(Math.random() * 1_000);
  const code = new CallbackServer(port).waitForCode("state", controller.signal);
  await new Promise((resolve) => setTimeout(resolve, 10));
  expect(await request(port, "/callback?state=state&code=code")).toBe(200);
  expect(await code).toBe("code");
});

