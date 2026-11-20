const STAMP_CUSTOM_ID_PREFIX = "stamp:";
const MAX_STAMPS = 25;

export const definition = { name: "stamp", description: "スタンプを選んで投稿します" };

export async function handle(interaction, env) {
  try {
    const stamps = await loadStamps(env);
    if (stamps.length === 0) return response("スタンプが設定されていません。", true);

    return response({
      content: "投稿するスタンプを選んでください。",
      components: chunk(stamps, 5).map((row) => ({
        type: 1,
        components: row.map((stamp) => ({
          type: 2,
          style: 2,
          label: stamp.label,
          emoji: stamp.emoji,
          custom_id: `${STAMP_CUSTOM_ID_PREFIX}${stamp.id}`,
        })),
      })),
    }, true);
  } catch (error) {
    console.error(JSON.stringify({ event: "stamp_load_error", error: String(error) }));
    return response("スタンプを読み込めませんでした。管理者に設定を確認してもらってください。", true);
  }
}

export function isStampInteraction(name) {
  return name?.startsWith(STAMP_CUSTOM_ID_PREFIX) ?? false;
}

export async function processStampInteraction(interaction, env) {
  const stampId = interaction.data?.custom_id?.slice(STAMP_CUSTOM_ID_PREFIX.length);
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
  const manifestUrl = env.STAMP_MANIFEST_URL;
  if (!manifestUrl) throw new Error("STAMP_MANIFEST_URL is not configured");
  const response = await fetch(manifestUrl, { cf: { cacheTtl: 300 } });
  if (!response.ok) throw new Error(`Manifest request failed: ${response.status}`);
  const manifest = await response.json();
  if (manifest.version !== 1 || !Array.isArray(manifest.stamps)) throw new Error("Invalid stamp manifest");

  const stamps = manifest.stamps.slice(0, MAX_STAMPS).map(validateStamp);
  if (stamps.some((stamp) => !stamp)) throw new Error("Invalid stamp entry");
  return stamps;
}

function validateStamp(stamp) {
  if (!stamp || !/^[a-z0-9][a-z0-9_-]{0,31}$/.test(stamp.id)) return null;
  if (!stamp.label || String(stamp.label).length > 80 || !isHttpsUrl(stamp.gif)) return null;
  if (!stamp.emoji || (!stamp.emoji.name && !stamp.emoji.id)) return null;
  return {
    id: stamp.id,
    label: String(stamp.label),
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

function chunk(items, size) {
  const rows = [];
  for (let index = 0; index < items.length; index += size) rows.push(items.slice(index, index + size));
  return rows;
}
