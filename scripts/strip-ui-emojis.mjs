import fs from "fs";
import path from "path";

const emojiPattern =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]|[⚡✨⚠️📲👥✉️🏷️💰💳📁📥📅💡📑]/gu;

function cleanLine(line) {
  return line.replace(emojiPattern, "").replace(/  +/g, " ").trimEnd();
}

function cleanText(text) {
  return text
    .split("\n")
    .map((line) => cleanLine(line))
    .join("\n");
}

function walk(dir, exts) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, exts));
    else if (exts.some((e) => entry.name.endsWith(e))) out.push(full);
  }
  return out;
}

const roots = [path.join(process.cwd(), "src/i18n/messages")];

let changed = 0;
for (const root of roots) {
  if (!fs.existsSync(root)) continue;
  for (const file of walk(root, [".ts", ".tsx"])) {
    const before = fs.readFileSync(file, "utf8");
    const after = cleanText(before);
    if (after !== before) {
      fs.writeFileSync(file, after);
      changed++;
    }
  }
}
console.log("emoji files updated:", changed);
