import { describe, expect, it } from "vitest";

import { shouldRemoveSourceBlock } from "./block-cleanup";

describe("shouldRemoveSourceBlock", () => {
  it("returns true when source block is empty and has no children", () => {
    expect(shouldRemoveSourceBlock({ content: "   " })).toBe(true);
  });

  it("returns false when source block has content", () => {
    expect(shouldRemoveSourceBlock({ content: "keep this" })).toBe(false);
  });

  it("returns false when source block has children", () => {
    expect(shouldRemoveSourceBlock({ content: "", children: [{}] })).toBe(false);
  });

  it("returns false when block is missing", () => {
    expect(shouldRemoveSourceBlock(null)).toBe(false);
  });
});
