import { execSync } from "child_process";
import fs from "fs";
import path from "path";

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

const files = walk("src").filter((f) => {
  const text = fs.readFileSync(f, "utf8");
  return /from"/.test(text);
});

let restored = 0;
for (const file of files) {
  try {
    const content = execSync(`git show HEAD:${file.replace(/\\/g, "/")}`, {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    });
    fs.writeFileSync(file, content);
    restored++;
  } catch (err) {
    console.error("skip", file, err.message);
  }
}
console.log("restored", restored, "of", files.length);
