import { callGas, embedData, gasResponse } from "./gas.js";

export const definition = { name: "mail", description: "未読メールを確認します" };

export async function handle(interaction, env) {
  const result = await callGas("mail", interaction, env);
  return gasResponse(result, ({ messages = [] }) => embedData({
    title: "✉️ 未読メール",
    description: messages.length === 0 ? "未読メールはありません。" : undefined,
    color: 15158332,
    fields: messages.slice(0, 10).map((message) => ({
      name: `${message.receivedAt} ${message.subject}`.slice(0, 256),
      value: `[${message.from}](${message.url})`,
      inline: false,
    })),
    footer: { text: "本文は表示していません" },
  }, [{ type: 1, components: [{ type: 2, style: 1, label: "再読み込み", custom_id: "mail_refresh" }] }]), interaction);
}
