import { readFile } from "fs/promises";
import path from "path";
import { describe, expect, it } from "vitest";

describe("project config", () => {
  it("uses index.html as Logseq plugin entry", async () => {
    const packageJsonPath = path.resolve(process.cwd(), "package.json");
    const raw = await readFile(packageJsonPath, "utf8");
    const pkg = JSON.parse(raw) as {
      main?: string;
      scripts?: Record<string, string>;
    };

    expect(pkg.main).toBe("index.html");
    expect(pkg.scripts?.["package:release"]).toContain("scripts/package-release.mjs");
  });

  it("loads Logseq SDK from local release file", async () => {
    const indexHtmlPath = path.resolve(process.cwd(), "index.html");
    const html = await readFile(indexHtmlPath, "utf8");

    expect(html).toContain("./lsplugin.user.js");
    expect(html).not.toContain("./node_modules/");
  });
});
