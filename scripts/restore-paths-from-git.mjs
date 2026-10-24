import { execSync } from "child_process";
import fs from "fs";

const paths = process.argv.slice(2);
if (paths.length === 0) {
  console.error("Usage: node restore-paths-from-git.mjs <path>...");
  process.exit(1);
}

for (const file of paths) {
  const content = execSync(`git show HEAD:${file.replace(/\\/g, "/")}`, {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  const tmp = `${file}.restore-tmp`;
  fs.writeFileSync(tmp, content);
  fs.renameSync(tmp, file);
  console.log("restored", file);
}
