import type { CommandHandler, DiscordCommand } from "./types";

export const definition: DiscordCommand = {
  name: "choice",
  description: "候補から1つをランダムに選びます",
  options: [{ type: 3, name: "options", description: "カンマ区切りの候補（例: ラーメン,カレー,そば）", required: true }],
};

export const handle: CommandHandler = (interaction) => {
  const input = String(interaction.data?.options?.find((option) => option.name === "options")?.value ?? "");
  const choices = input.split(",").map((choice) => choice.trim()).filter(Boolean);
  if (choices.length < 2) {
    return new Response(JSON.stringify({ type: 4, data: { content: "候補をカンマ区切りで2つ以上指定してください。", flags: 64 } }), {
      headers: { "content-type": "application/json" },
    });
  }
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  const selected = choices[value[0] % choices.length];
  return new Response(JSON.stringify({ type: 4, data: { content: `🎯 **${selected}**` } }), {
    headers: { "content-type": "application/json" },
  });
};
