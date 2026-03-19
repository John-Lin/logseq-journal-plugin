import { formatIsoDate, formatIsoDateFromJournalDay } from "./core";

type ImportedFileContent = {
  filename: string;
  content: string;
};

type ParsedImportedFile = {
  filename: string;
  body: string;
  label: string;
  timestamp: number | null;
};

const DEFAULT_IMPORT_TAG = "journal";

export type ImportedBatchBlock = {
  content: string;
  children?: ImportedBatchBlock[];
};

export function resolveTargetIsoDate(
  journalDay: number | undefined,
  now: Date,
): string {
  if (typeof journalDay === "number") {
    return formatIsoDateFromJournalDay(journalDay);
  }

  return formatIsoDate(now);
}

export function resolveJournalIsoDate(journalDay: number | undefined): string {
  if (typeof journalDay !== "number") {
    throw new Error("Current page is not a journal page");
  }

  return formatIsoDateFromJournalDay(journalDay);
}

export function buildImportedBlockContent(
  isoDate: string,
  importedFiles: ImportedFileContent[],
  resourceTagPath?: string,
): string {
  const header = `> ${buildImportTitle(isoDate, resourceTagPath)}`;
  const parsedFiles = importedFiles
    .map((file) => parseImportedFile(file))
    .sort(compareImportedFiles);

  if (parsedFiles.length === 1) {
    return `${header}\n\n${normalizeBodyForLogseq(parsedFiles[0].body)}`;
  }

  const fileSections = parsedFiles
    .map(
      (file) => `${file.label}\n${normalizeBodyForLogseq(file.body)}`,
    )
    .join("\n\n");

  return `${header}\n\n${fileSections}`;
}

export function buildImportedBatchBlock(
  isoDate: string,
  importedFiles: ImportedFileContent[],
  resourceTagPath?: string,
): ImportedBatchBlock {
  const parsedFiles = importedFiles
    .map((file) => parseImportedFile(file))
    .sort(compareImportedFiles);

  return {
    content: buildImportTitle(isoDate, resourceTagPath),
    children: parsedFiles.flatMap((file) => buildEntryBlocks(file)),
  };
}

const IMPORT_TITLE_PREFIX = "Imported from private journal:";

export function isExistingImportBlock(content: string, isoDate: string): boolean {
  return content.startsWith(`${IMPORT_TITLE_PREFIX} ${isoDate} `);
}

function buildImportTitle(isoDate: string, resourceTagPath?: string): string {
  const tag = normalizeImportTag(resourceTagPath);
  return `${IMPORT_TITLE_PREFIX} ${isoDate} ${tag}`;
}

function normalizeImportTag(resourceTagPath: string | undefined): string {
  const trimmed = resourceTagPath?.trim() ?? "";
  if (trimmed.length === 0) {
    return `#${DEFAULT_IMPORT_TAG}`;
  }

  const withoutHash = trimmed.replace(/^#+/, "").trim();
  if (withoutHash.length === 0) {
    return `#${DEFAULT_IMPORT_TAG}`;
  }

  return `#${withoutHash}`;
}

function compareImportedFiles(left: ParsedImportedFile, right: ParsedImportedFile): number {
  if (left.timestamp !== null && right.timestamp !== null) {
    return left.timestamp - right.timestamp;
  }

  if (left.timestamp !== null) {
    return -1;
  }

  if (right.timestamp !== null) {
    return 1;
  }

  return left.filename.localeCompare(right.filename);
}

function parseImportedFile(file: ImportedFileContent): ParsedImportedFile {
  const { metadata, body } = stripFrontmatter(file.content);
  const timestamp = parseTimestamp(metadata.timestamp);

  return {
    filename: file.filename,
    body,
    label: resolveEntryLabel(file.filename, metadata.title, timestamp),
    timestamp,
  };
}

function stripFrontmatter(content: string): {
  metadata: Record<string, string>;
  body: string;
} {
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n)?/);
  if (!frontmatterMatch) {
    return {
      metadata: {},
      body: content.trimEnd(),
    };
  }

  const metadata: Record<string, string> = {};
  for (const line of frontmatterMatch[1].split(/\r?\n/)) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    if (!key || !rawValue) {
      continue;
    }

    metadata[key] = stripSurroundingQuotes(rawValue);
  }

  const strippedBody = content
    .slice(frontmatterMatch[0].length)
    .replace(/^\s*\r?\n/, "")
    .trimEnd();

  return {
    metadata,
    body: strippedBody,
  };
}

function stripSurroundingQuotes(value: string): string {
  if (value.length < 2) {
    return value;
  }

  const firstChar = value[0];
  const lastChar = value[value.length - 1];
  if ((firstChar === '"' || firstChar === "'") && firstChar === lastChar) {
    return value.slice(1, -1);
  }

  return value;
}

function parseTimestamp(raw: string | undefined): number | null {
  if (!raw) {
    return null;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

function resolveEntryLabel(
  filename: string,
  _title: string | undefined,
  timestamp: number | null,
): string {
  if (timestamp !== null) {
    return formatTimestampAsTime(timestamp);
  }

  return filename;
}

function formatTimestampAsTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function buildEntryBlocks(file: ParsedImportedFile): ImportedBatchBlock[] {
  const lines = file.body.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  type Section = {
    heading: string | null;
    lines: string[];
  };

  const sections: Section[] = [];
  let currentSection: Section = { heading: null, lines: [] };

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
    if (headingMatch) {
      if (currentSection.heading !== null || currentSection.lines.length > 0) {
        sections.push(currentSection);
      }

      currentSection = {
        heading: headingMatch[1].trim(),
        lines: [],
      };
      continue;
    }

    currentSection.lines.push(line.replace(/^#{1,6}\s+/, ""));
  }

  if (currentSection.heading !== null || currentSection.lines.length > 0) {
    sections.push(currentSection);
  }

  if (sections.length === 0) {
    return [{ content: file.label }];
  }

  return sections.map((section) => ({
    content: section.heading ? `${file.label} — ${section.heading}` : file.label,
    children: section.lines.map((line) => ({ content: line })),
  }));
}

function normalizeBodyForLogseq(body: string): string {
  return body
    .split(/\r?\n/)
    .map((line) => line.replace(/^#{1,6}\s+/, ""))
    .join("\n")
    .trim();
}
