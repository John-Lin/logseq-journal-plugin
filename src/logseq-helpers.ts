export function extractJournalDay(page: unknown): number | undefined {
  if (!page || typeof page !== "object") {
    return undefined;
  }

  const candidate = page as {
    "journal?"?: unknown;
    journalDay?: unknown;
  };

  if (candidate["journal?"] !== true) {
    return undefined;
  }

  const { journalDay } = candidate;
  if (typeof journalDay !== "number") {
    return undefined;
  }

  return journalDay;
}
