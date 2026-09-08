import { callGas, gasResponse } from "./gas.js";

export const definition = { name: "schedule", description: "今日の予定を確認します" };

export async function handle(interaction, env) {
  const result = await callGas("schedule", interaction, env);
  return gasResponse(result, ({ events = [] }) => {
    if (events.length === 0) return "📅 今日の予定はありません。";
    const lines = events.map((event) => `・${event.start}〜${event.end} ${event.title}${event.location ? `（${event.location}）` : ""}`);
    return `📅 **今日の予定**\n${lines.join("\n")}`.slice(0, 1900);
  });
}
