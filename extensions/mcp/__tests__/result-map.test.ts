import { expect, test } from "vitest";
import { mapContent } from "../domain/result-map.js";
test("maps images and unknown blocks", () => {
  expect(
    mapContent([
      { type: "image", data: "x", mimeType: "image/png" },
      { type: "resource", uri: "x" },
    ]),
  ).toEqual([
    { type: "image", data: "x", mimeType: "image/png" },
    { type: "text", text: '{"type":"resource","uri":"x"}' },
  ]);
});
