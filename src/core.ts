export function formatIsoDateFromJournalDay(journalDay: number): string {
  const raw = String(journalDay);
  if (!/^\d{8}$/.test(raw)) {
    throw new Error(`Invalid journal day: ${journalDay}`);
  }

  const year = raw.slice(0, 4);
  const month = raw.slice(4, 6);
  const day = raw.slice(6, 8);
  return `${year}-${month}-${day}`;
}

export function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function expandHomePath(inputPath: string, homeDirectory: string): string {
  if (inputPath === "~") {
    return homeDirectory;
  }

  if (inputPath.startsWith("~/")) {
    return `${homeDirectory}/${inputPath.slice(2)}`;
  }

  return inputPath;
}

export function selectDailyMarkdownFilenames(
  filenames: string[],
  isoDatePrefix: string,
): string[] {
  return filenames
    .filter((filename) => filename.startsWith(isoDatePrefix) && filename.endsWith(".md"))
    .sort((left, right) => left.localeCompare(right));
}
