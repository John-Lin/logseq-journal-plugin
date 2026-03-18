import { selectDailyMarkdownFilenames } from "./core";

export type ImportedFileContent = {
  filename: string;
  content: string;
};

type FileHandleLike = {
  kind: "file";
  name: string;
  getFile: () => Promise<{ text: () => Promise<string> }>;
};

export type DirectoryHandleLike = {
  kind: "directory";
  name: string;
  entries: () => AsyncIterable<[string, HandleLike]>;
  getDirectoryHandle: (name: string) => Promise<DirectoryHandleLike>;
  queryPermission?: (descriptor?: { mode?: "read" | "readwrite" }) => Promise<string>;
  requestPermission?: (descriptor?: { mode?: "read" | "readwrite" }) => Promise<string>;
};

type HandleLike = FileHandleLike | DirectoryHandleLike;

export async function loadDailyMarkdownFilesFromDirectoryHandle(
  rootDirectoryHandle: DirectoryHandleLike,
  isoDate: string,
): Promise<Array<ImportedFileContent>> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    throw new Error(`Invalid target date: ${isoDate}`);
  }

  const rootHandles: Array<FileHandleLike> = [];
  for await (const [, handle] of rootDirectoryHandle.entries()) {
    if (handle.kind === "file") {
      rootHandles.push(handle);
    }
  }

  const rootFileNames = rootHandles.map((handle) => handle.name);
  const matchedRootFiles = selectDailyMarkdownFilenames(rootFileNames, isoDate);
  const rootFileMap = new Map(rootHandles.map((handle) => [handle.name, handle]));

  const importedFiles: Array<ImportedFileContent> = [];
  for (const filename of matchedRootFiles) {
    const handle = rootFileMap.get(filename);
    if (!handle) {
      continue;
    }

    importedFiles.push({
      filename,
      content: await readFileText(handle),
    });
  }

  const dayFolderFiles = await readDayFolderMarkdownFiles(rootDirectoryHandle, isoDate);
  importedFiles.push(...dayFolderFiles);

  return importedFiles;
}

async function readDayFolderMarkdownFiles(
  rootDirectoryHandle: DirectoryHandleLike,
  isoDate: string,
): Promise<Array<ImportedFileContent>> {
  let dayDirectoryHandle: DirectoryHandleLike;
  try {
    dayDirectoryHandle = await rootDirectoryHandle.getDirectoryHandle(isoDate);
  } catch (error) {
    if (isNotFoundError(error)) {
      return [];
    }

    throw error;
  }

  const dayFileEntries: Array<{ filename: string; handle: FileHandleLike }> = [];
  for await (const [entryName, handle] of dayDirectoryHandle.entries()) {
    if (handle.kind !== "file" || !entryName.endsWith(".md")) {
      continue;
    }

    dayFileEntries.push({
      filename: `${isoDate}/${entryName}`,
      handle,
    });
  }

  dayFileEntries.sort((left, right) => left.filename.localeCompare(right.filename));

  const importedFiles: Array<ImportedFileContent> = [];
  for (const entry of dayFileEntries) {
    importedFiles.push({
      filename: entry.filename,
      content: await readFileText(entry.handle),
    });
  }

  return importedFiles;
}

async function readFileText(handle: FileHandleLike): Promise<string> {
  const file = await handle.getFile();
  return file.text();
}

function isNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  return "name" in error && error.name === "NotFoundError";
}
