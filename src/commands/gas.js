const DEFAULT_GAS_TIMEOUT_MS = 2_500;
const MAIL_GAS_TIMEOUT_MS = 10_000;

export function privateResponse(content) {
  return new Response(JSON.stringify({ type: 4, data: { content, flags: 64 } }), {
    headers: { "content-type": "application/json" },
  });
}

export async function callGas(action, interaction, env, parameters = {}) {
  const userId = interaction.user?.id ?? interaction.member?.user?.id;
  if (!env.GAS_WEB_APP_URL || !env.GAS_SHARED_TOKEN) return privateResponse("GAS連携が設定されていません。");

  const controller = new AbortController();
  const timeoutMs = action === "mail" ? MAIL_GAS_TIMEOUT_MS : DEFAULT_GAS_TIMEOUT_MS;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const request = {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: env.GAS_SHARED_TOKEN, action, discordUserId: userId, ...parameters }),
      signal: controller.signal,
      redirect: "manual",
    };
    let response = await fetch(env.GAS_WEB_APP_URL, request);
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("GAS redirect did not include a location");
      response = await fetch(location, { signal: controller.signal });
    }
    if (!response.ok) throw new Error(`GAS responded with ${response.status}`);
    const result = await response.json();
    if (!result.ok) throw new Error("GAS returned an application error");
    return result;
  } catch (error) {
    console.error(JSON.stringify({ event: "gas_request_error", action, error: String(error) }));
    return privateResponse("Googleサービスから情報を取得できませんでした。しばらくしてから再試行してください。");
  } finally {
    clearTimeout(timeout);
  }
}

export function gasResponse(result, formatter, interaction, { ephemeral = false } = {}) {
  if (result instanceof Response) return result;
  const data = formatter(result);
  if (ephemeral && interaction?.type !== 3) data.flags = 64;
  return new Response(JSON.stringify({ type: interaction?.type === 3 ? 7 : 4, data }), {
    headers: { "content-type": "application/json" },
  });
}

export function embedData(embed, components) {
  return { embeds: [embed], components };
}
