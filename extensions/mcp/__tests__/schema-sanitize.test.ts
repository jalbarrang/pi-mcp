import { expect, test } from "bun:test";
import { sanitizeInputSchema } from "../domain/schema-sanitize.js";
test("converts enum to string schema", () =>
  expect(sanitizeInputSchema({ enum: ["a"] })).toEqual({
    schema: { enum: ["a"], type: "string" },
  }));
test("rejects references", () =>
  expect(sanitizeInputSchema({ $ref: "x" })).toEqual({
    skip: "Schema references are unsupported",
  }));
