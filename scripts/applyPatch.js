const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const patchesDir = path.join(root, "patches");

function runGit(args) {
  return spawnSync("git", ["-C", root, ...args], {
    encoding: "utf8",
  });
}

function hasUnstagedChanges() {
  const status = runGit(["status", "--short"]);
  if (status.status !== 0) {
    process.stderr.write(status.stderr || status.stdout || "");
    return true;
  }

  return status.stdout
    .split("\n")
    .filter(Boolean)
    .some((line) => line[1] !== " ");
}

function getPatchPaths() {
  if (!fs.existsSync(patchesDir)) {
    return [];
  }

  return fs
    .readdirSync(patchesDir)
    .filter((file) => file.endsWith(".patch"))
    .sort()
    .map((file) => path.join(patchesDir, file));
}

function applyPatch(patchPath) {
  const patchName = path.basename(patchPath);
  const alreadyApplied = runGit(["apply", "--reverse", "--check", patchPath]);
  if (alreadyApplied.status === 0) {
    console.log(`applyPatch: ${patchName} already applied`);
    return true;
  }

  const canApply = runGit(["apply", "--check", patchPath]);
  if (canApply.status !== 0) {
    process.stderr.write(canApply.stderr || canApply.stdout || "");
    return false;
  }

  const applied = runGit(["apply", patchPath]);
  if (applied.status !== 0) {
    process.stderr.write(applied.stderr || applied.stdout || "");
    return false;
  }

  console.log(`applyPatch: applied ${patchName}`);
  return true;
}

function main() {
  if (hasUnstagedChanges()) {
    console.error(
      "applyPatch: unstaged changes detected; commit or stash them before applying patches",
    );
    process.exitCode = 1;
    return;
  }

  const patchPaths = getPatchPaths();

  if (!patchPaths.length) {
    console.log("applyPatch: no patch files found");
    return;
  }

  for (const patchPath of patchPaths) {
    const ok = applyPatch(patchPath);
    if (!ok) {
      process.exitCode = 1;
      return;
    }
  }
}

main();
