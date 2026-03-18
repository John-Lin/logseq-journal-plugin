import { readFile } from "fs/promises";
import path from "path";
import { describe, expect, it } from "vitest";

describe("startup performance safeguards", () => {
  it("avoids eager Node module imports in startup source", async () => {
    const mainPath = path.resolve(process.cwd(), "src", "main.ts");
    const loaderPath = path.resolve(process.cwd(), "src", "file-loader.ts");
    const mainSource = await readFile(mainPath, "utf8");
    const loaderSource = await readFile(loaderPath, "utf8");

    expect(mainSource).not.toContain('from "os"');
    expect(loaderSource).not.toContain('from "fs/promises"');
    expect(loaderSource).not.toContain('from "path"');
  });
});
