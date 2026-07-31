import type { CommandHandler, DiscordCommand } from "./types";

export const definition: DiscordCommand = {
  name: "qr",
  description: "テキストやURLからQRコードを作成します",
  options: [{ type: 3, name: "text", description: "QRコードにするテキストまたはURL", required: true }],
};

export const handle: CommandHandler = (interaction) => {
  const text = String(interaction.data?.options?.find((option) => option.name === "text")?.value ?? "");
  const imageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
  return new Response(JSON.stringify({ type: 4, data: { content: `📱 ${text}`, embeds: [{ image: { url: imageUrl } }] } }), {
    headers: { "content-type": "application/json" },
  });
};
