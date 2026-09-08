import pokemonData from "../data/pokemon.json" with { type: "json" };

export const definition  = {
  name: "poke",
  description: "ポケモンの図鑑ページを検索します",
  options: [{ type: 3, name: "name", description: "ポケモン名（例: ピカチュウ）", required: true }],
};

const entries = pokemonData ;

export const handle  = (interaction) => {
  const query = String(interaction.data?.options?.find((option) => option.name === "name")?.value ?? "").trim();
  const matches = entries.filter((entry) => entry.name === query || entry.name.startsWith(`${query} (`) || entry.name.startsWith(`${query}（`));
  if (matches.length === 0) {
    return new Response(JSON.stringify({ type: 4, data: { content: `「${query}」は見つかりませんでした。`, flags: 64 } }), {
      headers: { "content-type": "application/json" },
    });
  }
  const links = matches.map((entry) => `・[${entry.name}](https://yakkun.com${entry.href})`).join("\n");
  return new Response(JSON.stringify({ type: 4, data: { content: `🔎 **${query}**\n${links}` } }), {
    headers: { "content-type": "application/json" },
  });
};
