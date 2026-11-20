#!/usr/bin/env node
import fs from "node:fs/promises";

const apiUrl = "https://api.github.com/repos/ak-2302/EmoteLab/contents/Export/mei_all_2026-11-21-00-42-59?ref=master";
const output = "/Users/myuser/Documents/GitHub/discord-stamps/stamps/manifest.json";
const response = await fetch(apiUrl, { headers: { accept: "application/vnd.github+json" } });
if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
const files = (await response.json()).filter((file) => file.type === "file" && file.name.endsWith(".gif"));
const old = JSON.parse(await fs.readFile(output, "utf8"));
const oldById = new Map(old.stamps.map((stamp) => [stamp.id, stamp]));
const usedIds = new Set();
const stamps = files.map((file, index) => {
  const baseId = file.name.slice(0, -4).toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24);
  const id = uniqueId(baseId || `stamp-${index + 1}`, usedIds);
  const previous = oldById.get(id);
  return {
    id,
    label: `スタンプ${String(index + 1).padStart(3, "0")}`,
    description: file.name.slice(0, -4),
    emoji: previous?.emoji ?? { name: "✨" },
    gif: file.download_url,
  };
});
await fs.writeFile(output, `${JSON.stringify({ version: 1, stamps }, null, 2)}\n`);
console.log(`${stamps.length}件のスタンプを生成しました: ${output}`);

function uniqueId(baseId, used) {
  let id = baseId;
  let suffix = 2;
  while (used.has(id)) id = `${baseId.slice(0, 32 - String(suffix).length - 1)}-${suffix++}`;
  used.add(id);
  return id;
}
