import sharp from "sharp";
import path from "node:path";
import fs from "node:fs/promises";

const sourceIcon = path.join(process.cwd(), "public/icons/brand-logo.png");
const resDir = path.join(process.cwd(), "android/app/src/main/res");

const iconDensities = [
  { folder: "mipmap-mdpi", size: 48, fgSize: 108 },
  { folder: "mipmap-hdpi", size: 72, fgSize: 162 },
  { folder: "mipmap-xhdpi", size: 96, fgSize: 216 },
  { folder: "mipmap-xxhdpi", size: 144, fgSize: 324 },
  { folder: "mipmap-xxxhdpi", size: 192, fgSize: 432 },
];

const splashDensities = [
  { folder: "drawable", width: 480, height: 800 },
  { folder: "drawable-port-mdpi", width: 320, height: 480 },
  { folder: "drawable-port-hdpi", width: 480, height: 800 },
  { folder: "drawable-port-xhdpi", width: 720, height: 1280 },
  { folder: "drawable-port-xxhdpi", width: 960, height: 1600 },
  { folder: "drawable-port-xxxhdpi", width: 1280, height: 1920 },
  { folder: "drawable-land-mdpi", width: 480, height: 320 },
  { folder: "drawable-land-hdpi", width: 800, height: 480 },
  { folder: "drawable-land-xhdpi", width: 1280, height: 720 },
  { folder: "drawable-land-xxhdpi", width: 1600, height: 960 },
  { folder: "drawable-land-xxxhdpi", width: 1920, height: 1280 },
];

async function generate() {
  console.log("Generating Android App Icons...");

  for (const { folder, size, fgSize } of iconDensities) {
    const targetFolder = path.join(resDir, folder);
    await fs.mkdir(targetFolder, { recursive: true });

    // 1. Standard icon
    await sharp(sourceIcon)
      .resize(size, size, { fit: "contain", background: { r: 6, g: 95, b: 70, alpha: 1 } })
      .png()
      .toFile(path.join(targetFolder, "ic_launcher.png"));

    // 2. Round icon
    await sharp(sourceIcon)
      .resize(size, size, { fit: "contain", background: { r: 6, g: 95, b: 70, alpha: 1 } })
      .png()
      .toFile(path.join(targetFolder, "ic_launcher_round.png"));

    // 3. Foreground icon for adaptive icons (with safe margin)
    const logoInner = await sharp(sourceIcon)
      .resize(Math.round(fgSize * 0.65), Math.round(fgSize * 0.65), { fit: "contain" })
      .toBuffer();

    await sharp({
      create: {
        width: fgSize,
        height: fgSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: logoInner, gravity: "center" }])
      .png()
      .toFile(path.join(targetFolder, "ic_launcher_foreground.png"));

    console.log(`✓ ${folder} (${size}x${size}, fg: ${fgSize}x${fgSize})`);
  }

  console.log("\nGenerating Android Splash Screens...");

  for (const { folder, width, height } of splashDensities) {
    const targetFolder = path.join(resDir, folder);
    await fs.mkdir(targetFolder, { recursive: true });

    const logoSize = Math.round(Math.min(width, height) * 0.38);
    const logo = await sharp(sourceIcon)
      .resize(logoSize, logoSize, { fit: "contain" })
      .toBuffer();

    await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 251, g: 249, b: 244, alpha: 1 }, // Sanadat warm cream background (#FBF9F4)
      },
    })
      .composite([{ input: logo, gravity: "center" }])
      .png()
      .toFile(path.join(targetFolder, "splash.png"));

    console.log(`✓ ${folder}/splash.png (${width}x${height})`);
  }

  console.log("\n✅ All Android launcher icons and splash screens generated successfully!");
}

generate().catch(console.error);
