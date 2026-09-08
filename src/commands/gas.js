const GAS_TIMEOUT_MS = 2_500;

export function privateResponse(content) {
  return new Response(JSON.stringify({ type: 4, data: { content, flags: 64 } }), {
    headers: { "content-type": "application/json" },
  });
}

export async function callGas(action, interaction, env) {
  const userId = interaction.user?.id ?? interaction.member?.user?.id;
  if (!userId || userId !== env.DISCORD_ALLOWED_USER_ID) return privateResponse("このコマンドを実行する権限がありません。");
  if (!env.GAS_WEB_APP_URL || !env.GAS_SHARED_TOKEN) return privateResponse("GAS連携が設定されていません。");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GAS_TIMEOUT_MS);
  try {
    const request = {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: env.GAS_SHARED_TOKEN, action, discordUserId: userId }),
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

export function gasResponse(result, formatter) {
  if (result instanceof Response) return result;
  return new Response(JSON.stringify({ type: 4, data: { content: formatter(result) } }), {
    headers: { "content-type": "application/json" },
  });
}
