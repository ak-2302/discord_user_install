import type { CommandHandler, DiscordCommand } from "./types";

export const definition: DiscordCommand = {
  name: "ping",
  description: "応答確認をします",
};

export const handle: CommandHandler = () =>
  new Response(JSON.stringify({ type: 4, data: { content: "Pong!", flags: 64 } }), {
    headers: { "content-type": "application/json" },
  });
