import { expect, test } from "vitest";
import { mergeCatalogs } from "../domain/config-merge.js";

test("later config overrides a complete server entry", () => {
  const { catalog } = mergeCatalogs([
    { mcpServers: { demo: { command: "old", args: ["a"] } } },
    { mcpServers: { demo: { command: "new" } } },
  ]);
  expect(catalog.get("demo")).toMatchObject({ command: "new", args: [] });
});

test("disabled server is retained as disabled", () => {
  const { catalog } = mergeCatalogs([{ mcpServers: { off: { command: "cmd", enabled: false } } }]);
  expect(catalog.get("off")?.enabled).toBe(false);
});
