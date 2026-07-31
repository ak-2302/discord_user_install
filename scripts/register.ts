const applicationId = process.env.DISCORD_APPLICATION_ID;
const token = process.env.DISCORD_TOKEN;

export {};

if (!applicationId || !token) throw new Error("DISCORD_APPLICATION_ID と DISCORD_TOKEN を環境変数に設定してください。");

const response = await fetch(`https://discord.com/api/v10/applications/${applicationId}/commands`, {
  method: "PUT",
  headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify([{ name: "ping", description: "応答確認をします" }]),
});

if (!response.ok) throw new Error(`Discord API error ${response.status}: ${await response.text()}`);
console.log("/ping コマンドを登録しました。");
