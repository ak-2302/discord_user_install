#!/usr/bin/env node
import "dotenv/config";
import fs from "node:fs/promises";

const manifestPath = "/Users/myuser/Documents/GitHub/discord-stamps/stamps/manifest.json";
const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const endpoint = `https://discord.com/api/v10/applications/${process.env.DISCORD_APPLICATION_ID}/emojis`;
const response = await fetch(endpoint, { headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}` } });
if (!response.ok) throw new Error(`Discord API error: ${response.status}`);
const emojis = new Map((await response.json()).items.map((emoji) => [emoji.name, emoji]));

let missing = 0;
for (const stamp of manifest.stamps) {
  const emoji = emojis.get(`stamp_${stamp.id.replace(/-/g, "_")}`);
  if (!emoji) {
    missing += 1;
    continue;
  }
  stamp.emoji = { name: emoji.name, id: emoji.id, animated: emoji.animated === true };
}
if (missing) throw new Error(`${missing}件のアプリ絵文字がmanifestに見つかりません`);
await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`${manifest.stamps.length}件の絵文字IDをmanifestへ同期しました`);
