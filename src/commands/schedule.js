import { callGas, embedData, gasResponse } from "./gas.js";

export const definition = { name: "schedule", description: "今日の予定を確認します" };

export async function handle(interaction, env) {
  const customId = interaction.data?.custom_id ?? "";
  if (customId === "schedule_open_modal") return dateModalResponse();
  const modalDate = interaction.data?.components?.[0]?.components?.[0]?.value;
  const date = interaction.data?.values?.[0] ?? modalDate ?? (customId.startsWith("schedule_refresh_") ? customId.slice("schedule_refresh_".length) : "today");
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
    return embedData(embed, [
      { type: 1, components: [{ type: 3, custom_id: "schedule_date", placeholder: "表示する範囲を選択", options: [
        { label: "今日", value: "today", description: "今日の予定", default: date === "today" },
        { label: "明日", value: "tomorrow", description: "明日の予定", default: date === "tomorrow" },
        { label: "今月", value: "this_month", description: "今月の予定", default: date === "this_month" },
      ] }] },
      { type: 1, components: [
        { type: 2, style: 1, label: "日付を指定", custom_id: "schedule_open_modal" },
        { type: 2, style: 1, label: "再読み込み", custom_id: `schedule_refresh_${date}` },
      ] },
    ]);
  }, interaction);
}

function dateModalResponse() {
  return new Response(JSON.stringify({ type: 9, data: {
    custom_id: "schedule_date_modal",
    title: "予定の日付を指定",
    components: [{ type: 1, components: [{ type: 4, custom_id: "schedule_date_input", label: "日付（YYYY-MM-DD）", style: 1, placeholder: "2026-09-22", required: true, min_length: 10, max_length: 10 }] }],
  } }), { headers: { "content-type": "application/json" } });
}
