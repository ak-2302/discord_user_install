import * as ping from "./ping";
import * as dice from "./dice";
import * as weather from "./weather";
import * as qr from "./qr";
import * as coin from "./coin";
import * as choice from "./choice";
import * as poke from "./poke";
import type { CommandHandler, DiscordCommand } from "./types";

export const definitions: DiscordCommand[] = [ping.definition, dice.definition, weather.definition, qr.definition, coin.definition, choice.definition, poke.definition];

const handlers = new Map<string, CommandHandler>([
  [ping.definition.name, ping.handle],
  [dice.definition.name, dice.handle],
  [weather.definition.name, weather.handle],
  [qr.definition.name, qr.handle],
  [coin.definition.name, coin.handle],
  [choice.definition.name, choice.handle],
  [poke.definition.name, poke.handle],
]);

export function handleCommand(name: string | undefined, interaction: Parameters<CommandHandler>[0]): ReturnType<CommandHandler> {
  return handlers.get(name ?? "")?.(interaction) ?? null;
}
