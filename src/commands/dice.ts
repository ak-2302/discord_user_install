import type { CommandHandler, DiscordCommand } from "./types";

export const definition: DiscordCommand = {
  name: "dice",
  description: "6面サイコロを2個振ります（2d6）",
};

function rollD6(): number {
  const values = new Uint32Array(1);
  const limit = Math.floor(0x1_0000_0000 / 6) * 6;
  do {
    crypto.getRandomValues(values);
  } while (values[0] >= limit);
  return (values[0] % 6) + 1;
}

export const handle: CommandHandler = () => {
  const rolls = [rollD6(), rollD6()];
  const total = rolls[0] + rolls[1];
  return new Response(
    JSON.stringify({
      type: 4,
      data: {
        content: `🎲 2d6: **${rolls[0]} + ${rolls[1]} = ${total}**`,
      },
    }),
    { headers: { "content-type": "application/json" } },
  );
};
