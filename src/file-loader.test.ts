import { describe, expect, it } from "vitest";

import { loadDailyMarkdownFilesFromDirectoryHandle } from "./file-loader";

type FakeFileHandle = {
  kind: "file";
  name: string;
  getFile: () => Promise<{ text: () => Promise<string> }>;
};

type FakeDirectoryHandle = {
  kind: "directory";
  name: string;
  entries: () => AsyncIterable<[string, FakeHandle]>;
  getDirectoryHandle: (name: string) => Promise<FakeDirectoryHandle>;
};

type FakeHandle = FakeFileHandle | FakeDirectoryHandle;

describe("loadDailyMarkdownFilesFromDirectoryHandle", () => {
  it("loads date-prefixed markdown files from root and date subfolder", async () => {
    const rootHandle = createDirectoryHandle("private-journal", {
      "2026-03-18.md": createFileHandle("2026-03-18.md", "root a\n"),
      "2026-03-18-notes.md": createFileHandle("2026-03-18-notes.md", "root b"),
      "2026-03-18.txt": createFileHandle("2026-03-18.txt", "ignore"),
      "2026-03-18": createDirectoryHandle("2026-03-18", {
        "00-01.md": createFileHandle("00-01.md", "day a\n"),
        "23-59.md": createFileHandle("23-59.md", "day b"),
        "note.txt": createFileHandle("note.txt", "ignore"),
      }),
    });

    const files = await loadDailyMarkdownFilesFromDirectoryHandle(rootHandle, "2026-03-18");
    expect(files.map((file) => file.filename)).toEqual([
      "2026-03-18-notes.md",
      "2026-03-18.md",
      "2026-03-18/00-01.md",
      "2026-03-18/23-59.md",
    ]);
  });

  it("returns root matches when date folder does not exist", async () => {
    const rootHandle = createDirectoryHandle("private-journal", {
      "2026-03-18.md": createFileHandle("2026-03-18.md", "root a\n"),
    });

    const files = await loadDailyMarkdownFilesFromDirectoryHandle(rootHandle, "2026-03-18");
    expect(files.map((file) => file.filename)).toEqual(["2026-03-18.md"]);
  });

  it("rejects invalid date values", async () => {
    const rootHandle = createDirectoryHandle("private-journal", {
      "2026-03-18.md": createFileHandle("2026-03-18.md", "root a\n"),
    });

    await expect(
      loadDailyMarkdownFilesFromDirectoryHandle(rootHandle, "2026-03-"),
    ).rejects.toThrow("Invalid target date");
  });
});

function createFileHandle(name: string, content: string): FakeFileHandle {
  return {
    kind: "file",
    name,
    getFile: async () => ({
      text: async () => content,
    }),
  };
}

function createDirectoryHandle(
  name: string,
  children: Record<string, FakeHandle>,
): FakeDirectoryHandle {
  return {
    kind: "directory",
    name,
    entries: async function* () {
      for (const [childName, childHandle] of Object.entries(children)) {
        yield [childName, childHandle];
      }
    },
    getDirectoryHandle: async (childName: string) => {
      const child = children[childName];
      if (!child || child.kind !== "directory") {
        throw { name: "NotFoundError" };
      }

      return child;
    },
  };
}
