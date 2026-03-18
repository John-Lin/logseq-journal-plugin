import { describe, expect, it } from "vitest";

import {
  expandHomePath,
  formatIsoDate,
  formatIsoDateFromJournalDay,
  selectDailyMarkdownFilenames,
} from "./core";

describe("formatIsoDateFromJournalDay", () => {
  it("converts Logseq journal day number into yyyy-mm-dd", () => {
    expect(formatIsoDateFromJournalDay(20260318)).toBe("2026-03-18");
  });
});

describe("formatIsoDate", () => {
  it("formats Date as yyyy-mm-dd in local time", () => {
    const date = new Date(2026, 2, 18);
    expect(formatIsoDate(date)).toBe("2026-03-18");
  });
});

describe("expandHomePath", () => {
  it("expands ~ to user home directory", () => {
    expect(expandHomePath("~/.private-journal", "/Users/john")).toBe(
      "/Users/john/.private-journal",
    );
  });

  it("returns original value when path does not start with ~", () => {
    expect(expandHomePath("/tmp/private", "/Users/john")).toBe("/tmp/private");
  });
});

describe("selectDailyMarkdownFilenames", () => {
  it("keeps only markdown files with date prefix", () => {
    const filenames = [
      "2026-03-18.md",
      "2026-03-18-notes.md",
      "2026-03-18.txt",
      "2026-03-17.md",
      "readme.md",
    ];

    expect(selectDailyMarkdownFilenames(filenames, "2026-03-18")).toEqual([
      "2026-03-18-notes.md",
      "2026-03-18.md",
    ]);
  });
});
