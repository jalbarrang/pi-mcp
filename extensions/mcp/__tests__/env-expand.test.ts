import { expect, test } from "vitest";
import { expandEnv } from "../domain/env-expand.js";

test("expands strings, arrays, and records", () => {
  expect(expandEnv(["${HOME}", "x"], { HOME: "/home/a" }).value).toEqual(["/home/a", "x"]);
  expect(expandEnv({ key: "${HOME}" }, { HOME: "/home/a" }).value).toEqual({ key: "/home/a" });
});

test("keeps missing variables and records a warning", () => {
  expect(expandEnv("${NOPE}", {}).value).toBe("${NOPE}");
  expect(expandEnv("${NOPE}", {}).warnings).toEqual(["Missing environment variable: NOPE"]);
});
