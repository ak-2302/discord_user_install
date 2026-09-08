
export const definition  = {
  name: "weather",
  description: "複数都市の現在の天気を表示します",
};

const cities = ["Tokyo", "Osaka", "Sapporo", "Fukuoka"];

const weatherText  = {
  0: "快晴", 1: "晴れ", 2: "薄曇り", 3: "曇り", 45: "霧", 48: "着氷性の霧",
  51: "弱い霧雨", 53: "霧雨", 55: "強い霧雨", 61: "弱い雨", 63: "雨", 65: "強い雨",
  71: "弱い雪", 73: "雪", 75: "強い雪", 80: "弱いにわか雨", 81: "にわか雨", 82: "強いにわか雨",
  95: "雷雨", 96: "雷雨・ひょう", 99: "雷雨・強いひょう",
};

export const handle  = async (interaction) => {
  const contents = await Promise.all(cities.map(async (city) => {
    const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ja&format=json`);
    if (!geoResponse.ok) throw new Error(`Geocoding API error: ${geoResponse.status}`);
    const geo = await geoResponse.json();
    const location = geo.results?.[0];
    if (!location) return `**${city}**: 見つかりませんでした。`;
    const forecastResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`);
    if (!forecastResponse.ok) throw new Error(`Forecast API error: ${forecastResponse.status}`);
    const forecast = await forecastResponse.json();
    const current = forecast.current;
    return `🌤️ **${location.name}**: ${weatherText[current.weather_code] ?? "不明"} / ${current.temperature_2m}${forecast.current_units.temperature_2m} / 湿度${current.relative_humidity_2m}% / 風速${current.wind_speed_10m}${forecast.current_units.wind_speed_10m}`;
  }));
  const content = `🌍 **各都市の天気**\n${contents.join("\n")}`;
  return new Response(JSON.stringify({ type: 4, data: { content } }), { headers: { "content-type": "application/json" } });
};
