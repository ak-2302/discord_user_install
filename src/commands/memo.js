export const definition = { name: "memo", description: "仮データのメモを表示します" };

export function handle() {
  const memos = [
    { title: "買い物", body: "牛乳、卵、パンを買う", updatedAt: "2026-09-22 09:00" },
    { title: "作業メモ", body: "Discordアプリの改善案を整理する", updatedAt: "2026-09-21 18:30" },
    { title: "アイデア", body: "予定とメールをまとめて確認できる画面を作る", updatedAt: "2026-09-20 14:15" },
  ];
  return new Response(JSON.stringify({
    type: 4,
    data: {
      embeds: [{
        title: "📝 メモ（仮データ）",
        description: "現在はサンプルデータを表示しています。",
        color: 16753920,
        fields: memos.map((memo) => ({
          name: memo.title,
          value: `${memo.body}\n更新日時：${memo.updatedAt}`,
          inline: false,
        })),
        footer: { text: "メモ機能は仮実装です" },
      }],
    },
  }), { headers: { "content-type": "application/json" } });
}
