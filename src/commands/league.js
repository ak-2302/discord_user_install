
export const definition  = {
  name: "league",
  description: "LoLチャンピオンの攻略リンクを表示します",
  options: [{ type: 3, name: "champion", description: "チャンピオン名（例: ゾーイ）", required: true }],
};

const slugOverrides  = {
  AurelionSol: "aurelion-sol",
  Belveth: "belveth",
  ChoGath: "chogath",
  DrMundo: "dr-mundo",
  JarvanIV: "jarvan-iv",
  KhaZix: "kha-zix",
  KogMaw: "kogmaw",
  KSante: "k-sante",
  LeeSin: "lee-sin",
  MasterYi: "master-yi",
  MissFortune: "miss-fortune",
  RekSai: "rek-sai",
  TahmKench: "tahm-kench",
  TwistedFate: "twisted-fate",
  XinZhao: "xin-zhao",
};

function toSlug(id) {
  return slugOverrides[id] ?? id.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

export const handle  = async (interaction) => {
  const query = String(interaction.data?.options?.find((option) => option.name === "champion")?.value ?? "").trim();
  const versionsResponse = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
  if (!versionsResponse.ok) throw new Error(`Data Dragon versions error: ${versionsResponse.status}`);
  const versions = (await versionsResponse.json()) ;
  const version = versions[0];
  const championsResponse = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/ja_JP/champion.json`);
  if (!championsResponse.ok) throw new Error(`Data Dragon champion error: ${championsResponse.status}`);
  const champions = (await championsResponse.json()) ;
  const champion = Object.values(champions.data).find((item) => item.name === query || item.id.toLowerCase() === query.toLowerCase());
  if (!champion) {
    return new Response(JSON.stringify({ type: 4, data: { content: `「${query}」が見つかりませんでした。日本語名で指定してください。`, flags: 64 } }), {
      headers: { "content-type": "application/json" },
    });
  }
  const slug = toSlug(champion.id);
  const content = [
    `⚔️ **${champion.name}**`,
    `[LoL日本語Wiki](https://www.loljp-wiki.jp/wiki/?Champion%2F${champion.id})`,
    `[OP.GG](https://op.gg/ja/lol/champions/${slug}/build)`,
    `[LoLalytics](https://lolalytics.com/ja/lol/${slug}/build/)`,
  ].join("\n");
  return new Response(JSON.stringify({ type: 4, data: { content } }), { headers: { "content-type": "application/json" } });
};
