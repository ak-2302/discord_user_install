import { handleCommand } from "./commands/index.js";


const encoder = new TextEncoder();

async function verifyDiscordRequest(request, publicKey) {
  const signature = request.headers.get("X-Signature-Ed25519");
  const timestamp = request.headers.get("X-Signature-Timestamp");
  if (!signature || !timestamp) return null;

  const body = await request.text();
  const key = await crypto.subtle.importKey(
    "raw",
    hexToBytes(publicKey),
    { name: "Ed25519" },
    false,
    ["verify"],
  );
  const valid = await crypto.subtle.verify(
    "Ed25519",
    key,
    hexToBytes(signature),
    encoder.encode(timestamp + body),
  );
  return valid ? body : null;
}

function hexToBytes(value) {
  if (!/^[0-9a-f]+$/i.test(value) || value.length % 2 !== 0) throw new Error("Invalid hex value");
  const bytes = new Uint8Array(value.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = Number.parseInt(value.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

function json(data , status = 200)  {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}

function isMailInteraction(interaction) {
  const name = interaction.type === 2 ? interaction.data?.name : interaction.data?.custom_id;
  return name?.startsWith("mail");
}

function deferredMailResponse(interaction) {
  return json({ type: interaction.type === 3 ? 6 : 5, data: interaction.type === 3 ? undefined : { flags: 64 } });
}

async function updateDeferredMail(interaction, env) {
  const endpoint = `https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`;
  try {
    const response = await handleCommand(
      interaction.type === 2 ? interaction.data?.name : interaction.data?.custom_id,
      interaction,
      env,
    );
    const payload = await response.json();
    if (payload.data) delete payload.data.flags;
    const update = await fetch(endpoint, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload.data ?? {}),
    });
    if (!update.ok) throw new Error(`Discord update failed with ${update.status}`);
  } catch (error) {
    console.error(JSON.stringify({ event: "discord_mail_update_error", error: String(error) }));
    await fetch(endpoint, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: "メールを取得できませんでした。しばらくしてから再試行してください。", embeds: [], components: [] }),
    });
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/") return new Response("Discord user-install worker is running.");
    if (request.method !== "POST" || url.pathname !== "/interactions") return new Response("Not Found", { status: 404 });

    let body;
    try {
      body = await verifyDiscordRequest(request, env.DISCORD_PUBLIC_KEY);
    } catch (error) {
      console.error(JSON.stringify({ event: "signature_verification_error", error: String(error) }));
      return new Response("Bad Request", { status: 400 });
    }
    if (!body) return new Response(" invalid request signature", { status: 401 });

    const interaction = JSON.parse(body);
    if (interaction.type === 1) return json({ type: 1 });
    if ((interaction.type === 2 || interaction.type === 3) && isMailInteraction(interaction)) {
      ctx.waitUntil(updateDeferredMail(interaction, env));
      return deferredMailResponse(interaction);
    }
    if (interaction.type === 2) return (await handleCommand(interaction.data?.name, interaction, env)) ?? json({ type: 4, data: { content: "未対応のコマンドです。", flags: 64 } });
    if (interaction.type === 3) return (await handleCommand(interaction.data?.custom_id, interaction, env)) ?? json({ type: 4, data: { content: "未対応の操作です。", flags: 64 } });
    return json({ type: 4, data: { content: "未対応のコマンドです。", flags: 64 } });
  },
};
