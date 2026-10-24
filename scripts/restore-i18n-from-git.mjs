import { execSync } from "child_process";
import fs from "fs";
import path from "path";

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith(".ts")) out.push(full);
  }
  return out;
}

const root = path.join(process.cwd(), "src/i18n/messages");
for (const file of walk(root)) {
  const rel = path.relative(process.cwd(), file).replace(/\\/g, "/");
  const content = execSync(`git show HEAD:${rel}`, {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  const tmp = `${file}.restore-tmp`;
  fs.writeFileSync(tmp, content);
  fs.renameSync(tmp, file);
  console.log("restored", rel);
}
