import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SOURCE_PATH = "C:/Users/DYANN/.gemini/antigravity/brain/7fb96a7f-f8dd-45b5-9438-f5c5be0e7478/.user_uploaded/media_1791405964425.jpg";
const DEST_PNG = "public/mia.png";
const DEST_ROBOT_PNG = "public/machtia-tutor-robot.png";
const DEST_OFFICIAL_JPG = "public/mia-official.jpg";

async function run() {
  if (!fs.existsSync(SOURCE_PATH)) {
    throw new Error("Source image not found at " + SOURCE_PATH);
  }

  // Copy official JPG
  fs.copyFileSync(SOURCE_PATH, DEST_OFFICIAL_JPG);
  console.log("✓ Saved original asset to", DEST_OFFICIAL_JPG);

  const image = sharp(SOURCE_PATH);
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  console.log(`Processing image: ${width}x${height}, ${channels} channels`);

  // Create RGBA buffer (4 channels)
  const rgba = Buffer.alloc(width * height * 4);

  const BLACK_THRESHOLD_LOW = 12;
  const BLACK_THRESHOLD_HIGH = 36;

  for (let i = 0; i < width * height; i++) {
    const srcIdx = i * channels;
    const dstIdx = i * 4;

    const r = data[srcIdx];
    const g = data[srcIdx + 1];
    const b = data[srcIdx + 2];

    const maxVal = Math.max(r, g, b);

    if (maxVal <= BLACK_THRESHOLD_LOW) {
      rgba[dstIdx] = 0;
      rgba[dstIdx + 1] = 0;
      rgba[dstIdx + 2] = 0;
      rgba[dstIdx + 3] = 0; // Fully transparent
    } else if (maxVal < BLACK_THRESHOLD_HIGH) {
      const alphaFactor = (maxVal - BLACK_THRESHOLD_LOW) / (BLACK_THRESHOLD_HIGH - BLACK_THRESHOLD_LOW);
      const alpha = Math.round(alphaFactor * 255);

      // Defringe: scale RGB up slightly to avoid dark fringe on anti-aliased edges
      const scale = 1 / Math.max(0.2, alphaFactor);
      rgba[dstIdx] = Math.min(255, Math.round(r * scale));
      rgba[dstIdx + 1] = Math.min(255, Math.round(g * scale));
      rgba[dstIdx + 2] = Math.min(255, Math.round(b * scale));
      rgba[dstIdx + 3] = alpha;
    } else {
      rgba[dstIdx] = r;
      rgba[dstIdx + 1] = g;
      rgba[dstIdx + 2] = b;
      rgba[dstIdx + 3] = 255; // Fully opaque
    }
  }

  // Save as optimized web PNG
  await sharp(rgba, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(DEST_PNG);

  console.log("✓ Generated transparent PNG:", DEST_PNG);

  // Also update public/machtia-tutor-robot.png
  fs.copyFileSync(DEST_PNG, DEST_ROBOT_PNG);
  console.log("✓ Synchronized platform avatar:", DEST_ROBOT_PNG);

  // Check output metadata
  const meta = await sharp(DEST_PNG).metadata();
  console.log("Output PNG metadata:", {
    format: meta.format,
    width: meta.width,
    height: meta.height,
    hasAlpha: meta.hasAlpha,
    channels: meta.channels,
    fileSizeKB: Math.round(fs.statSync(DEST_PNG).size / 1024),
  });
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
