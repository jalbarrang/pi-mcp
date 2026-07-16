import { expect, test } from "vitest";
import { applyFilters } from "../domain/tool-filter.js";
const tools = ["a", "b"].map((name) => ({ name, inputSchema: {} }));
test("applies exact include and exclude filters", () =>
  expect(applyFilters(tools, ["a", "b"], ["b"]).map((tool) => tool.name)).toEqual(["a"]));
