import { callGas, gasResponse } from "./gas.js";

export const definition = { name: "mail", description: "未読メールを確認します" };

export async function handle(interaction, env) {
  const result = await callGas("mail", interaction, env);
  return gasResponse(result, ({ messages = [] }) => {
    if (messages.length === 0) return "✉️ 未読メールはありません。";
    const lines = messages.map((message) => `・${message.receivedAt} ${message.from}「${message.subject}」\n  ${message.url}`);
    return `✉️ **未読メール（${messages.length}件）**\n${lines.join("\n")}`.slice(0, 1900);
  });
}
