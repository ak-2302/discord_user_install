interface DiscordInteraction {
  type: number;
  data?: { name?: string };
}

type RuntimeEnv = Env & { DISCORD_PUBLIC_KEY: string };

const encoder = new TextEncoder();

async function verifyDiscordRequest(request: Request, publicKey: string): Promise<string | null> {
  const signature = request.headers.get("X-Signature-Ed25519");
  const timestamp = request.headers.get("X-Signature-Timestamp");
  if (!signature || !timestamp) return null;

  const body = await request.text();
  const key = await crypto.subtle.importKey(
    "raw",
    hexToBytes(publicKey),
    { name: "Ed25519" },
    false,
    ["verify"],
  );
  const valid = await crypto.subtle.verify(
    "Ed25519",
    key,
    hexToBytes(signature),
    encoder.encode(timestamp + body),
  );
  return valid ? body : null;
}

function hexToBytes(value: string): Uint8Array {
  if (!/^[0-9a-f]+$/i.test(value) || value.length % 2 !== 0) throw new Error("Invalid hex value");
  const bytes = new Uint8Array(value.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = Number.parseInt(value.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}

export default {
  async fetch(request: Request, env: RuntimeEnv): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/") return new Response("Discord user-install worker is running.");
    if (request.method !== "POST" || url.pathname !== "/interactions") return new Response("Not Found", { status: 404 });

    let body: string | null;
    try {
      body = await verifyDiscordRequest(request, env.DISCORD_PUBLIC_KEY);
    } catch (error) {
      console.error(JSON.stringify({ event: "signature_verification_error", error: String(error) }));
      return new Response("Bad Request", { status: 400 });
    }
    if (!body) return new Response(" invalid request signature", { status: 401 });

    const interaction = JSON.parse(body) as DiscordInteraction;
    if (interaction.type === 1) return json({ type: 1 });
    if (interaction.type === 2 && interaction.data?.name === "ping") {
      return json({ type: 4, data: { content: "Pong!", flags: 64 } });
    }
    return json({ type: 4, data: { content: "未対応のコマンドです。", flags: 64 } });
  },
} satisfies ExportedHandler<RuntimeEnv>;
