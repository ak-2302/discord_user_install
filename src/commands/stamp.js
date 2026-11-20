const STAMP_CUSTOM_ID_PREFIX = "stamp:";
const MAX_STAMPS = 239;
const STAMPS_PER_PAGE = 20;
const DEFAULT_STAMP_MANIFEST_URL = "https://raw.githubusercontent.com/ak-2302/discord-stamps/main/stamps/manifest.json";

export const definition = { name: "stamp", description: "スタンプを選んで投稿します" };

export async function handle(interaction, env) {
  try {
    const stamps = await loadStamps(env);
    if (stamps.length === 0) return response("スタンプが設定されていません。", true);

    return stampPageResponse(stamps, 0, true);
  } catch (error) {
    console.error(JSON.stringify({ event: "stamp_load_error", error: String(error) }));
    return response("スタンプを読み込めませんでした。管理者に設定を確認してもらってください。", true);
  }
}

export function isStampInteraction(name) {
  return name?.startsWith(STAMP_CUSTOM_ID_PREFIX) ?? false;
}

export function isStampPageInteraction(name) {
  return /^stamp:page:\d+$/.test(name ?? "");
}

export async function renderStampPageInteraction(interaction, env) {
  try {
    const stamps = await loadStamps(env);
    const page = Number(interaction.data.custom_id.slice(`${STAMP_CUSTOM_ID_PREFIX}page:`.length));
    return stampPageResponse(stamps, page, false, 7);
  } catch (error) {
    console.error(JSON.stringify({ event: "stamp_page_error", error: String(error) }));
    return new Response(JSON.stringify({ type: 4, data: { content: "スタンプを読み込めませんでした。", flags: 64 } }), {
      headers: { "content-type": "application/json" },
    });
  }
}

export async function processStampInteraction(interaction, env) {
  const stampId = interaction.data?.custom_id?.startsWith(`${STAMP_CUSTOM_ID_PREFIX}select:`)
    ? interaction.data.values?.[0]
    : interaction.data?.custom_id?.slice(STAMP_CUSTOM_ID_PREFIX.length);
  if (!stampId) return;

  try {
    const stamp = (await loadStamps(env)).find((candidate) => candidate.id === stampId);
    if (!stamp) throw new Error("Unknown stamp");

    const webhook = `https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}`;
    const deleteResponse = await fetch(`${webhook}/messages/@original`, { method: "DELETE" });
    if (!deleteResponse.ok && deleteResponse.status !== 404) {
      throw new Error(`Failed to delete ephemeral response: ${deleteResponse.status}`);
    }

    const postResponse = await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        embeds: [{ image: { url: stamp.gif } }],
        allowed_mentions: { parse: [] },
      }),
    });
    if (!postResponse.ok) throw new Error(`Failed to post stamp: ${postResponse.status}`);
  } catch (error) {
    console.error(JSON.stringify({ event: "stamp_post_error", error: String(error) }));
  }
}

async function loadStamps(env) {
  const manifestUrl = env.STAMP_MANIFEST_URL || DEFAULT_STAMP_MANIFEST_URL;
  const response = await fetch(manifestUrl);
  if (!response.ok) throw new Error(`Manifest request failed: ${response.status}`);
  const manifest = await response.json();
  if (manifest.version !== 1 || !Array.isArray(manifest.stamps)) throw new Error("Invalid stamp manifest");

  const stamps = manifest.stamps.slice(0, MAX_STAMPS).map(validateStamp);
  if (stamps.some((stamp) => !stamp)) throw new Error("Invalid stamp entry");
  return stamps;
}

function validateStamp(stamp) {
  if (!stamp || !/^[a-z0-9][a-z0-9_-]{0,31}$/.test(stamp.id)) return null;
  if (!stamp.label || String(stamp.label).length > 100 || !isHttpsUrl(stamp.gif)) return null;
  if (!stamp.emoji || (!stamp.emoji.name && !stamp.emoji.id)) return null;
  return {
    id: stamp.id,
    label: String(stamp.label),
    description: stamp.description ? String(stamp.description).slice(0, 100) : undefined,
    gif: stamp.gif,
    emoji: {
      ...(stamp.emoji.name ? { name: String(stamp.emoji.name) } : {}),
      ...(stamp.emoji.id ? { id: String(stamp.emoji.id) } : {}),
      ...(stamp.emoji.animated ? { animated: true } : {}),
    },
  };
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function response(data, ephemeral) {
  return new Response(JSON.stringify({ type: 4, data: typeof data === "string" ? { content: data, flags: ephemeral ? 64 : 0 } : { ...data, flags: ephemeral ? 64 : 0 } }), {
    headers: { "content-type": "application/json" },
  });
}

function stampPageResponse(stamps, page, ephemeral, type = 4) {
  const pageCount = Math.ceil(stamps.length / STAMPS_PER_PAGE);
  const safePage = Math.max(0, Math.min(page, pageCount - 1));
  const pageStamps = stamps.slice(safePage * STAMPS_PER_PAGE, (safePage + 1) * STAMPS_PER_PAGE);
  const rows = chunk(pageStamps, 5).map((row) => ({
    type: 1,
    components: row.map((stamp) => ({
      type: 2,
      style: 2,
      label: stamp.label,
      emoji: stamp.emoji,
      custom_id: `${STAMP_CUSTOM_ID_PREFIX}${stamp.id}`,
    })),
  }));
  if (pageCount > 1) rows.push({
    type: 1,
    components: [
      { type: 2, style: 2, label: "前へ", custom_id: `${STAMP_CUSTOM_ID_PREFIX}page:${safePage - 1}`, disabled: safePage === 0 },
      { type: 2, style: 2, label: `ページ ${safePage + 1}/${pageCount}`, custom_id: `${STAMP_CUSTOM_ID_PREFIX}page:${safePage}`, disabled: true },
      { type: 2, style: 2, label: "次へ", custom_id: `${STAMP_CUSTOM_ID_PREFIX}page:${safePage + 1}`, disabled: safePage === pageCount - 1 },
    ],
  });
  const data = { content: `投稿するスタンプを選んでください（${safePage + 1}/${pageCount}）`, components: rows };
  return new Response(JSON.stringify({ type, data: ephemeral ? { ...data, flags: 64 } : data }), {
    headers: { "content-type": "application/json" },
  });
}

function chunk(items, size) {
  const rows = [];
  for (let index = 0; index < items.length; index += size) rows.push(items.slice(index, index + size));
  return rows;
}
