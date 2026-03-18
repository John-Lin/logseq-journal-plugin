import { describe, expect, it } from "vitest";

import {
  IMPORT_COMMAND,
  UNLINK_DIRECTORY_ACCESS_PALETTE_KEY,
  UNLINK_DIRECTORY_ACCESS_PALETTE_LABEL,
} from "./commands";

describe("slash command names", () => {
  it("uses short import command", () => {
    expect(IMPORT_COMMAND).toBe("journal");
  });

  it("uses unlink directory access command palette item", () => {
    expect(UNLINK_DIRECTORY_ACCESS_PALETTE_KEY).toBe("journal-unlink-directory-access");
    expect(UNLINK_DIRECTORY_ACCESS_PALETTE_LABEL).toBe("Journal: Unlink Directory Access");
  });
});
