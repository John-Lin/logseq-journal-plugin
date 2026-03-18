import { describe, expect, it } from "vitest";

import { extractJournalDay } from "./logseq-helpers";

describe("extractJournalDay", () => {
  it("returns journalDay when page is a journal page", () => {
    const page = {
      "journal?": true,
      journalDay: 20260318,
    };

    expect(extractJournalDay(page)).toBe(20260318);
  });

  it("returns undefined when page is not a journal page", () => {
    const page = {
      "journal?": false,
      journalDay: 20260318,
    };

    expect(extractJournalDay(page)).toBeUndefined();
  });

  it("returns undefined when journalDay is missing", () => {
    const page = {
      "journal?": true,
    };

    expect(extractJournalDay(page)).toBeUndefined();
  });
});
