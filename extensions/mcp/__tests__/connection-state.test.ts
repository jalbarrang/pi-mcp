import { expect, test } from "bun:test";
import { canTransition } from "../domain/connection-state.js";

test("allows an auth-required connection to retry", () => {
  expect(canTransition("connecting", "needs-auth")).toBe(true);
  expect(canTransition("needs-auth", "connecting")).toBe(true);
});
