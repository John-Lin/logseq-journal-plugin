import { describe, expect, it } from "vitest";

import {
  buildImportedBatchBlock,
  buildImportedBlockContent,
  isExistingImportBlock,
  resolveJournalIsoDate,
  resolveTargetIsoDate,
} from "./importer";

describe("resolveTargetIsoDate", () => {
  it("uses journal day when available", () => {
    const now = new Date(2026, 2, 20);
    expect(resolveTargetIsoDate(20260318, now)).toBe("2026-03-18");
  });

  it("falls back to current date when journal day is missing", () => {
    const now = new Date(2026, 2, 20);
    expect(resolveTargetIsoDate(undefined, now)).toBe("2026-03-20");
  });
});

describe("resolveJournalIsoDate", () => {
  it("resolves ISO date from journal day", () => {
    expect(resolveJournalIsoDate(20260318)).toBe("2026-03-18");
  });

  it("throws when current page is not a journal page", () => {
    expect(() => resolveJournalIsoDate(undefined)).toThrow(
      "Current page is not a journal page",
    );
  });
});

describe("buildImportedBlockContent", () => {
  it("keeps single file content without separators", () => {
    const content = buildImportedBlockContent("2026-03-18", [
      { filename: "2026-03-18.md", content: "## section\nline 2\n" },
    ]);

    expect(content).toBe(
      "> Imported from private journal: 2026-03-18 #journal\n\nsection\nline 2",
    );
  });

  it("adds labels without markdown separators when multiple files are imported", () => {
    const content = buildImportedBlockContent("2026-03-18", [
      { filename: "2026-03-18-a.md", content: "alpha" },
      { filename: "2026-03-18-b.md", content: "beta\n" },
    ]);

    expect(content).toBe(
      "> Imported from private journal: 2026-03-18 #journal\n\n2026-03-18-a.md\nalpha\n\n2026-03-18-b.md\nbeta",
    );
  });

  it("strips frontmatter and uses timestamp labels sorted by timestamp", () => {
    const content = buildImportedBlockContent("2026-03-18", [
      {
        filename: "2026-03-18/17-13-59-938119.md",
        content: `---
title: "5:13 PM"
timestamp: 1710000060000
---

## User Context
second
`,
      },
      {
        filename: "2026-03-18/15-08-05-358827.md",
        content: `---
title: "3:08 PM"
timestamp: 1710000000000
---

## User Context
first
`,
      },
    ]);

    expect(content).not.toContain("---");
    expect(content).not.toContain("## ");
    expect(content).not.toContain("5:13 PM");
    expect(content).not.toContain("3:08 PM");

    const labels = content
      .split("\n")
      .filter((line) => /^\d{1,2}:\d{2}\s[AP]M$/.test(line));

    expect(labels).toHaveLength(2);
    expect(content.indexOf("first")).toBeLessThan(content.indexOf("second"));
  });
});

describe("buildImportedBatchBlock", () => {
  it("builds nested bullet structure for each entry", () => {
    const batch = buildImportedBatchBlock("2026-03-18", [
      {
        filename: "2026-03-18/15-08-05-358827.md",
        content: `---
timestamp: 1710000000000
---

## User Context
John asked concise project analysis in Chinese.
`,
      },
    ]);

    expect(batch.content).toBe("Imported from private journal: 2026-03-18 #journal");
    expect(batch.children).toBeDefined();
    expect(batch.children?.length).toBe(1);
    expect(batch.children?.[0]?.content).toMatch(/^\d{1,2}:\d{2}\s[AP]M\s—\sUser Context$/);
    expect(batch.children?.[0]?.children).toEqual([
      {
        content: "John asked concise project analysis in Chinese.",
      },
    ]);
  });

  it("splits multiple section headings into separate time bullets", () => {
    const batch = buildImportedBatchBlock("2026-03-16", [
      {
        filename: "2026-03-16/13-44-00-000000.md",
        content: `---
timestamp: 1710596640000
---

## User Context
first paragraph

## Technical Insights
second paragraph
`,
      },
    ]);

    expect(batch.children?.length).toBe(2);
    expect(batch.children?.[0]?.content).toMatch(/^\d{1,2}:\d{2}\s[AP]M\s—\sUser Context$/);
    expect(batch.children?.[0]?.children).toEqual([{ content: "first paragraph" }]);
    expect(batch.children?.[1]?.content).toMatch(
      /^\d{1,2}:\d{2}\s[AP]M\s—\sTechnical Insights$/,
    );
    expect(batch.children?.[1]?.children).toEqual([{ content: "second paragraph" }]);
  });

  it("formats entry labels using AM/PM time", () => {
    const batch = buildImportedBatchBlock("2026-03-18", [
      {
        filename: "2026-03-18/15-08-05-358827.md",
        content: `---
timestamp: 1710000000000
---

hello
`,
      },
    ]);

    expect(batch.children?.[0]?.content).toMatch(/^\d{1,2}:\d{2}\s[AP]M$/);
  });

  it("uses custom resource tag path in import title", () => {
    const batch = buildImportedBatchBlock(
      "2026-03-18",
      [
        {
          filename: "2026-03-18/15-08-05-358827.md",
          content: "hello",
        },
      ],
      "Resource/custom-tag",
    );

    expect(batch.content).toBe(
      "Imported from private journal: 2026-03-18 #Resource/custom-tag",
    );
  });

  it("uses filename as label when no timestamp in frontmatter", () => {
    const batch = buildImportedBatchBlock("2026-03-18", [
      { filename: "2026-03-18-notes.md", content: "some notes" },
    ]);

    expect(batch.children?.[0]?.content).toBe("2026-03-18-notes.md");
  });

  it("keeps one leading hash when config already includes #", () => {
    const batch = buildImportedBatchBlock(
      "2026-03-18",
      [
        {
          filename: "2026-03-18/15-08-05-358827.md",
          content: "hello",
        },
      ],
      "#journal",
    );

    expect(batch.content).toBe("Imported from private journal: 2026-03-18 #journal");
  });
});

describe("isExistingImportBlock", () => {
  it("matches block with default tag", () => {
    expect(
      isExistingImportBlock("Imported from private journal: 2026-03-18 #journal", "2026-03-18"),
    ).toBe(true);
  });

  it("matches block with custom tag", () => {
    expect(
      isExistingImportBlock("Imported from private journal: 2026-03-18 #custom/tag", "2026-03-18"),
    ).toBe(true);
  });

  it("rejects different date", () => {
    expect(
      isExistingImportBlock("Imported from private journal: 2026-03-17 #journal", "2026-03-18"),
    ).toBe(false);
  });

  it("rejects unrelated block content", () => {
    expect(isExistingImportBlock("Some random block content", "2026-03-18")).toBe(false);
  });

  it("rejects empty content", () => {
    expect(isExistingImportBlock("", "2026-03-18")).toBe(false);
  });
});
