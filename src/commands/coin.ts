import type { CommandHandler, DiscordCommand } from "./types";

export const definition: DiscordCommand = { name: "coin", description: "コインを投げます" };

export const handle: CommandHandler = () => {
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  const result = value[0] % 2 === 0 ? "表" : "裏";
  return new Response(JSON.stringify({ type: 4, data: { content: `🪙 **${result}**` } }), {
    headers: { "content-type": "application/json" },
  });
};
