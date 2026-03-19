import { cp, mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";

const projectRoot = process.cwd();
const releaseDir = path.join(projectRoot, "release");

async function prepareReleaseDirectory() {
  await rm(releaseDir, { recursive: true, force: true });
  await mkdir(path.join(releaseDir, "dist"), { recursive: true });
}

async function readProjectPackageJson() {
  const packageJsonPath = path.join(projectRoot, "package.json");
  const packageJsonRaw = await readFile(packageJsonPath, "utf8");
  return JSON.parse(packageJsonRaw);
}

async function writeReleasePackageJson(packageJson) {
  const releasePackageJson = {
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description,
    author: packageJson.author,
    main: "index.html",
    logseq: packageJson.logseq,
    license: packageJson.license,
  };

  await writeFile(
    path.join(releaseDir, "package.json"),
    `${JSON.stringify(releasePackageJson, null, 2)}\n`,
    "utf8",
  );
}

async function copyRuntimeFiles(packageJson) {
  await cp(path.join(projectRoot, "index.html"), path.join(releaseDir, "index.html"));
  await cp(path.join(projectRoot, "dist", "main.js"), path.join(releaseDir, "dist", "main.js"));
  await cp(
    path.join(projectRoot, "node_modules", "@logseq", "libs", "dist", "lsplugin.user.js"),
    path.join(releaseDir, "lsplugin.user.js"),
  );

  const iconPath = packageJson.logseq?.icon;
  if (typeof iconPath === "string" && iconPath.length > 0) {
    const relativeIconPath = iconPath.replace(/^\.\//, "");
    const sourceIconPath = path.join(projectRoot, relativeIconPath);
    const targetIconPath = path.join(releaseDir, relativeIconPath);
    await mkdir(path.dirname(targetIconPath), { recursive: true });
    await cp(sourceIconPath, targetIconPath);
  }
}

async function main() {
  const packageJson = await readProjectPackageJson();
  await prepareReleaseDirectory();
  await copyRuntimeFiles(packageJson);
  await writeReleasePackageJson(packageJson);
  console.log("Release package generated in ./release");
}

main().catch((error) => {
  console.error("Failed to generate release package", error);
  process.exit(1);
});
