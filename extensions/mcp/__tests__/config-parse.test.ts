import { expect, test } from "bun:test";
import { parseServer } from "../domain/config-parse.js";

test("infers stdio from command", () => {
  expect(parseServer("one", { command: "bun" })).toMatchObject({ kind: "stdio", command: "bun" });
});

test("infers http from url and accepts sse", () => {
  expect(parseServer("one", { url: "https://example.test" })).toMatchObject({ kind: "http" });
  expect(parseServer("two", { type: "sse", url: "https://example.test" })).toMatchObject({
    kind: "sse",
  });
});
