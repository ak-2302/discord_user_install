
export const definition  = { name: "coin", description: "コインを投げます" };

export const handle  = () => {
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  const result = value[0] % 2 === 0 ? "表" : "裏";
  return new Response(JSON.stringify({ type: 4, data: { content: `🪙 **${result}**` } }), {
    headers: { "content-type": "application/json" },
  });
};
