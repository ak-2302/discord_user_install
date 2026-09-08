
export const definition  = {
  name: "ping",
  description: "応答確認をします",
};

export const handle  = () =>
  new Response(JSON.stringify({ type: 4, data: { content: "Pong!", flags: 64 } }), {
    headers: { "content-type": "application/json" },
  });
