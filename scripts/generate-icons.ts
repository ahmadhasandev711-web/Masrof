/**
 * One-off icon generation script — not part of the app's runtime.
 * `sharp` isn't a project dependency (it's only needed here), so if you
 * change scripts/icon-source.svg and want to regenerate the PNGs, run:
 *   npm i -D sharp && npx tsx scripts/generate-icons.ts && npm uninstall sharp
 */
import sharp from "sharp";
import path from "node:path";

const sourcePath = path.join(process.cwd(), "scripts/icon-source.svg");
const outputDir = path.join(process.cwd(), "public/icons");

const sizes = [
  { size: 192, name: "icon-192.png" },
  { size: 512, name: "icon-512.png" },
  { size: 180, name: "apple-touch-icon.png" }, // iOS home screen icon
];

async function main() {
  const fs = await import("node:fs/promises");
  await fs.mkdir(outputDir, { recursive: true });

  for (const { size, name } of sizes) {
    await sharp(sourcePath)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, name));
    console.log(`✅ generated ${name} (${size}x${size})`);
  }
}

main();
