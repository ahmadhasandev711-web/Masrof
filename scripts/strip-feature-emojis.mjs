import fs from "fs";
import path from "path";

const emojiPattern =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]|[⚡✨⚠️📲👥✉️🏷️💰💳📁📥📅💡📑🔁📝📥📱🔑🗑️💵🏦🪙💼⬇⊕⋮✕▲▼]/gu;

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith(".tsx") && !entry.name.includes(".test.")) out.push(full);
  }
  return out;
}

const roots = [
  path.join(process.cwd(), "src/features"),
  path.join(process.cwd(), "src/app"),
];

let changed = 0;
for (const root of roots) {
  if (!fs.existsSync(root)) continue;
  for (const file of walk(root)) {
    const before = fs.readFileSync(file, "utf8");
    const after = before
      .split("\n")
      .map((line) => line.replace(emojiPattern, ""))
      .join("\n");
    if (after !== before) {
      fs.writeFileSync(file, after);
      changed++;
    }
  }
}
console.log("feature/app tsx emoji files updated:", changed);
