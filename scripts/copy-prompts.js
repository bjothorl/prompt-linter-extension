const fs = require("fs");
const path = require("path");
const chokidar = require("chokidar");

function copyDir(src, dest) {
  // Create destination directory
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Read source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy prompts directory
const srcPromptsDir = path.join(__dirname, "..", "src", "prompts");
const destPromptsDir = path.join(__dirname, "..", "out", "prompts");

function copyPrompts() {
  if (fs.existsSync(srcPromptsDir)) {
    copyDir(srcPromptsDir, destPromptsDir);
    console.log("Prompt files copied successfully");
  } else {
    console.log("No prompt files to copy");
  }
}

if (process.argv.includes("--watch")) {
  console.log("Watching for prompt file changes...");
  chokidar.watch(srcPromptsDir).on("all", (event, path) => {
    console.log(`Detected ${event} in ${path}`);
    copyPrompts();
  });
} else {
  copyPrompts();
}
