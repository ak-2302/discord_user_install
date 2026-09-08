import { callGas, embedData, gasResponse } from "./gas.js";

export const definition = { name: "schedule", description: "今日の予定を確認します" };

export async function handle(interaction, env) {
  const date = interaction.data?.values?.[0] ?? (interaction.data?.custom_id?.endsWith("_tomorrow") ? "tomorrow" : "today");
  const result = await callGas("schedule", interaction, env, { date });
  return gasResponse(result, ({ events = [], label = "今日" }) => {
    const fields = events.map((event) => ({
      name: `${event.start}〜${event.end}`,
      value: `${event.title}${event.location ? `\n場所：${event.location}` : ""}`,
      inline: false,
    }));
    const embed = {
      title: `📅 ${label}の予定`,
      description: fields.length === 0 ? `${label}の予定はありません。` : undefined,
      color: 5814783,
      fields: fields.slice(0, 25),
      footer: { text: "Asia/Tokyo" },
    };
    return embedData(embed, [{ type: 1, components: [
      { type: 3, custom_id: "schedule_date", placeholder: "表示する日を選択", options: [
        { label: "今日", value: "today", description: "今日の予定", default: date === "today" },
        { label: "明日", value: "tomorrow", description: "明日の予定", default: date === "tomorrow" },
      ] },
      { type: 2, style: 1, label: "再読み込み", custom_id: `schedule_refresh_${date}` },
    ] }]);
  }, interaction);
}
