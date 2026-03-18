import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("release workflow", () => {
  it("builds release package and uploads plugin zip", async () => {
    const workflowPath = path.resolve(process.cwd(), ".github", "workflows", "publish.yml");
    const yaml = await readFile(workflowPath, "utf8");

    expect(yaml).toContain("on:");
    expect(yaml).toContain("release:");
    expect(yaml).toContain("types: [published]");
    expect(yaml).toContain("npm run package:release");
    expect(yaml).toContain("plugin-release.zip");
    expect(yaml).toContain("softprops/action-gh-release");
  });
});
