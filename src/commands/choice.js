
export const definition  = {
  name: "choice",
  description: "候補から1つをランダムに選びます",
  options: ["A", "B", "C", "D"].map((name) => ({ type: 3, name: name.toLowerCase(), description: `候補 ${name}`, required: name === "A" })),
};

export const handle  = (interaction) => {
  const choices = (interaction.data?.options ?? []).map((option) => String(option.value).trim()).filter(Boolean);
  if (choices.length < 2) {
    return new Response(JSON.stringify({ type: 4, data: { content: "候補をカンマ区切りで2つ以上指定してください。", flags: 64 } }), {
      headers: { "content-type": "application/json" },
    });
  }
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  const selected = choices[value[0] % choices.length];
  return new Response(JSON.stringify({ type: 4, data: { content: `🎯 **${selected}**` } }), {
    headers: { "content-type": "application/json" },
  });
};
