
export const definition  = {
  name: "unite",
  description: "ポケモンユナイトの攻略ページを表示します",
  options: [{ type: 3, name: "pokemon", description: "ポケモン名（例: アブソル）", required: true }],
};

export const handle  = (interaction) => {
  const pokemon = String(interaction.data?.options?.find((option) => option.name === "pokemon")?.value ?? "").trim();
  if (!pokemon) {
    return new Response(JSON.stringify({ type: 4, data: { content: "ポケモン名を指定してください。", flags: 64 } }), {
      headers: { "content-type": "application/json" },
    });
  }
  const url = `https://wikiwiki.jp/poke-unite/${encodeURIComponent(pokemon)}`;
  return new Response(JSON.stringify({ type: 4, data: { content: `⚔️ **${pokemon}**\n[ポケモンユナイト日本語Wiki](${url})` } }), {
    headers: { "content-type": "application/json" },
  });
};
