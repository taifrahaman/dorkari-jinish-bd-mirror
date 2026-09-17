// scripts/repomix-folder.js

import { select } from "@inquirer/prompts";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// Recursively find directories in the project
function getDirectories(
  dir = ".",
  ignore = [
    "node_modules",
    ".git",
    ".next",
    "dist",
    "build",
    ".output",
    ".cache",
    "coverage",
  ],
) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      if (ignore.includes(file)) return;
      const fullPath = path.join(dir, file);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          results.push(fullPath);
          results = results.concat(getDirectories(fullPath, ignore));
        }
      } catch (e) {
        // Skip unreadable files/folders
      }
    });
  } catch (e) {
    // Skip unreadable root dir
  }
  return results;
}

async function main() {
  const dirs = getDirectories(".");
  const choices = dirs.map((d) => ({
    name: d,
    value: d,
  }));

  if (choices.length === 0) {
    console.error("No subdirectories found.");
    process.exit(1);
  }

  const selectedFolder = await select({
    message: "Use arrow keys to select a folder to pack with Repomix:",
    choices: choices,
    pageSize: 15, // Number of items visible in the scrollable list
  });

  const safeName =
    path.basename(selectedFolder) || selectedFolder.replace(/[\/\\]/g, "-");
  const outputFile = `repomix-output-${safeName}.xml`;

  console.log(`\nPacking "${selectedFolder}" into "${outputFile}"...`);

  try {
    execSync(`npx repomix "${selectedFolder}" -o "${outputFile}" --copy`, {
      stdio: "inherit",
    });
    console.log(
      `\nDone! Output saved to ${outputFile} and copied to clipboard.`,
    );
  } catch (error) {
    console.error("Error running repomix:", error.message);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
