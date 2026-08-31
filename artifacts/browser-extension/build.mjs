import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, "dist");
const releaseDir = path.join(root, "release");
const version = JSON.parse(await readFile(path.join(root, "manifest.json"), "utf8")).version;
const archiveName = `zibs-stablecoin-research-connector-${version}.zip`;

await rm(dist, { recursive: true, force: true });
await mkdir(path.join(dist, "icons"), { recursive: true });
await mkdir(releaseDir, { recursive: true });
await cp(path.join(root, "manifest.json"), path.join(dist, "manifest.json"));
for (const file of ["background.js", "config.js", "popup.html", "popup.css", "popup.js"]) {
  await cp(path.join(root, "src", file), path.join(dist, file));
}
for (const size of [16, 32, 48, 128]) {
  await cp(path.join(root, "icons", `icon-${size}.png`), path.join(dist, "icons", `icon-${size}.png`));
}
const archive = path.join(releaseDir, archiveName);
await rm(archive, { force: true });
execFileSync("zip", ["-q", "-r", archive, "."], { cwd: dist });

const copyArgIndex = process.argv.indexOf("--copy-to");
if (copyArgIndex >= 0 && process.argv[copyArgIndex + 1]) {
  const target = path.resolve(root, process.argv[copyArgIndex + 1]);
  await mkdir(target, { recursive: true });
  await cp(archive, path.join(target, archiveName));
  await writeFile(path.join(target, "connector-release.json"), `${JSON.stringify({ version, file: archiveName }, null, 2)}\n`);
}

console.log(`Built ${archive}`);
