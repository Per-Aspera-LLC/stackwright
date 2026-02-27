const { execSync } = require("child_process");
const fs = require("fs");

function getChangedFiles() {
  const base = process.env.GITHUB_BASE_REF || "dev";

  try {
    // Ensure the base branch exists locally
    execSync(`git fetch origin ${base}`, { stdio: "inherit" });

    const diff = execSync(`git diff --name-only ${base}...HEAD`, {
      encoding: "utf-8",
    });
    return diff.split("\n").filter(Boolean);
  } catch (err) {
    console.error(`❌ Could not determine changed files from ${base}`, err.message);
    process.exit(1);
  }
}



function hasPackageChanges(files) {
  return files.some((file) => file.startsWith("packages/"));
}

function hasChangeset(files) {
  return files.some((file) => file.startsWith(".changeset/") && file.endsWith(".md"));
}

const changedFiles = getChangedFiles();

if (hasPackageChanges(changedFiles) && !hasChangeset(changedFiles)) {
  console.error(
    "\x1b[31m❌ This PR modifies packages but includes no Changeset.\n" +
    "Please run: pnpm changeset\x1b[0m"
  );
  process.exit(1);
} else {
  console.log("✅ Changeset requirement satisfied.");
}
