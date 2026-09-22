import { callGas, gasResponse } from "./gas.js";

export const definition = { name: "mail", description: "未読メールを確認します" };

export async function handle(interaction, env) {
  const result = await callGas("mail", interaction, env);
  return gasResponse(result, ({ messages = [] }) => {
    const embeds = messages.slice(0, 10).map((message) => ({
      title: `✉️ ${truncate(message.subject || "(件名なし)", 240)}`,
      url: message.url,
      color: 15158332,
      fields: [
        { name: "送信者", value: truncate(message.sender || "(不明)", 1024), inline: true },
        { name: "送信者アドレス", value: truncate(message.senderAddress || "(不明)", 1024), inline: true },
        { name: "本文", value: truncate(message.body || "(本文なし)", 4096), inline: false },
      ],
      footer: { text: `受信日時：${message.receivedAt || "不明"}` },
    }));
    if (embeds.length === 0) embeds.push({ title: "✉️ 未読メール", description: "未読メールはありません。", color: 15158332 });
    return { embeds, components: [{ type: 1, components: [{ type: 2, style: 1, label: "再読み込み", custom_id: "mail_refresh" }] }] };
  }, interaction, { ephemeral: true });
}

function truncate(value, maxLength) {
  const text = String(value).trim();
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 1)}…`;
}
