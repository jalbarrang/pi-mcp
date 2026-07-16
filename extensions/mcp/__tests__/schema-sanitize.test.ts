import { expect, test } from "vitest";
import { sanitizeInputSchema } from "../domain/schema-sanitize.js";

test("converts enum to string schema", () =>
  expect(sanitizeInputSchema({ enum: ["a"] })).toEqual({
    schema: { enum: ["a"], type: "string" },
  }));
test("rejects nested references", () =>
  expect(sanitizeInputSchema({ properties: { child: { $ref: "x" } } })).toEqual({
    skip: "Schema references are unsupported",
  }));
test("strips nested unsupported keywords", () =>
  expect(
    sanitizeInputSchema({ properties: { child: { $defs: { x: {} }, type: "string" } } }),
  ).toEqual({ schema: { properties: { child: { type: "string" } }, type: "object" } }));
test("converts anyOf constants to a string enum", () =>
  expect(sanitizeInputSchema({ anyOf: [{ const: "a" }, { const: "b" }] })).toEqual({
    schema: { type: "string", enum: ["a", "b"] },
  }));
test("rejects non-enum anyOf schemas", () =>
  expect(sanitizeInputSchema({ properties: { child: { anyOf: [{ type: "number" }] } } })).toEqual({
    skip: "anyOf schemas are unsupported",
  }));
test("sanitizes item schemas recursively", () =>
  expect(sanitizeInputSchema({ items: { patternProperties: {}, type: "string" } })).toEqual({
    schema: { items: { type: "string" }, type: "object" },
  }));
