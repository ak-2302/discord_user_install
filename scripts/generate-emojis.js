#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const args = parseArgs(process.argv.slice(2));
if (!args.input || !args.output) {
  console.error("使い方: node scripts/generate-emojis.js --input <送信用画像フォルダ> --output <絵文字用フォルダ>");
  process.exit(1);
}

const files = (await fs.readdir(args.input, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && /\.(gif|png|jpe?g|webp)$/i.test(entry.name))
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b));

await fs.mkdir(args.output, { recursive: true });
for (const file of files) {
  const id = path.basename(file, path.extname(file)).toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32);
  if (!id) continue;
  await sharp(path.join(args.input, file), { animated: false })
    .resize(128, 128, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(args.output, `${id}.png`));
}

console.log(`${files.length}件の送信用画像から絵文字用PNGを生成しました: ${args.output}`);

function parseArgs(values) {
  const result = {};
  for (let index = 0; index < values.length; index += 1) {
    if (values[index] === "--input") result.input = values[++index];
    if (values[index] === "--output") result.output = values[++index];
  }
  return result;
}
