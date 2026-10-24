import fs from "fs";
import path from "path";

const file = path.join(process.cwd(), "src/features/categories/seed-data.ts");
const emojiPattern = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu;
let text = fs.readFileSync(file, "utf8");
text = text.replace(/icon:\s*"[^"]*"/g, (match) => {
  const inner = match.slice(match.indexOf('"') + 1, -1).replace(emojiPattern, "");
  return `icon: "${inner}"`;
});
fs.writeFileSync(file, text);
console.log("seed-data category icons stripped");
