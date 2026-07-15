import { expect, test } from "bun:test";
import { bridgeToolName } from "../domain/tool-name.js";
test("sanitizes and resolves collisions", () => {
  expect(bridgeToolName("a b", "c.d")).toBe("a_b_c_d");
  expect(bridgeToolName("a", "b", new Set(["a_b", "a_b_2"]))).toBe("a_b_3");
});
