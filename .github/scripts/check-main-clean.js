const fs = require("fs");
const path = require("path");

const preModePath = path.join(".changeset", "pre.json");
const changesetDir = path.join(".changeset");

let hasError = false;

if (fs.existsSync(preModePath)) {
  console.error("\x1b[31m❌ ERROR: .changeset/pre.json exists.\nYou are still in prerelease mode.\nRun: pnpm changeset pre exit\x1b[0m");
  hasError = true;
}

const changesetFiles = fs
  .readdirSync(changesetDir)
  .filter((f) => f.endsWith(".md"));

if (changesetFiles.length > 0) {
  console.error("\x1b[31m❌ ERROR: Unused changesets found in .changeset/:\x1b[0m");
  changesetFiles.forEach((f) =>
    console.error(`  - .changeset/${f}`)
  );
  console.error("Run: pnpm changeset version\nThen commit and push the version bump.");
  hasError = true;
}

if (hasError) {
  process.exit(1);
} else {
  console.log("✅ Main is clean and ready for release.");
}
