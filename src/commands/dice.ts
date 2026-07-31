import type { CommandHandler, DiscordCommand } from "./types";

export const definition: DiscordCommand = {
  name: "dice",
  description: "指定した個数・面数のサイコロを振ります",
  options: [
    {
      type: 3,
      name: "roll",
      description: "XdY形式（例: 2d6、3d8）",
      required: true,
    },
  ],
};

function roll(sides: number): number {
  const values = new Uint32Array(1);
  const limit = Math.floor(0x1_0000_0000 / sides) * sides;
  do {
    crypto.getRandomValues(values);
  } while (values[0] >= limit);
  return (values[0] % sides) + 1;
}

export const handle: CommandHandler = (interaction) => {
  const expression = String(interaction.data?.options?.find((option) => option.name === "roll")?.value ?? "");
  const match = /^(\d+)d(\d+)$/i.exec(expression);
  if (!match) {
    return new Response(JSON.stringify({ type: 4, data: { content: "形式が正しくありません。`XdY`（例: `2d6`）で指定してください。", flags: 64 } }), {
      headers: { "content-type": "application/json" },
    });
  }
  const count = Number(match[1]);
  const sides = Number(match[2]);
  if (count < 1 || count > 100 || sides < 2 || sides > 1000) {
    return new Response(JSON.stringify({ type: 4, data: { content: "個数は1〜100、面数は2〜1000で指定してください。", flags: 64 } }), {
      headers: { "content-type": "application/json" },
    });
  }
  const rolls = Array.from({ length: count }, () => roll(sides));
  const total = rolls.reduce((sum, value) => sum + value, 0);
  return new Response(
    JSON.stringify({
      type: 4,
      data: {
        content: `🎲 ${count}d${sides}: **${rolls.join(" + ")} = ${total}**`,
      },
    }),
    { headers: { "content-type": "application/json" } },
  );
};
