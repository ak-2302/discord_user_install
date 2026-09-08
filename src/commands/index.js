import * as ping from "./ping.js";
import * as dice from "./dice.js";
import * as weather from "./weather.js";
import * as qr from "./qr.js";
import * as coin from "./coin.js";
import * as choice from "./choice.js";
import * as poke from "./poke.js";
import * as league from "./league.js";
import * as unite from "./unite.js";
import * as calc from "./calc.js";

export const definitions  = [ping.definition, dice.definition, weather.definition, qr.definition, coin.definition, choice.definition, poke.definition, league.definition, unite.definition, calc.definition];

const handlers = new Map([
  [ping.definition.name, ping.handle],
  [dice.definition.name, dice.handle],
  [weather.definition.name, weather.handle],
  [qr.definition.name, qr.handle],
  [coin.definition.name, coin.handle],
  [choice.definition.name, choice.handle],
  [poke.definition.name, poke.handle],
  [league.definition.name, league.handle],
  [unite.definition.name, unite.handle],
  [calc.definition.name, calc.handle],
]);

export function handleCommand(name, interaction) {
  return handlers.get(name ?? "")?.(interaction) ?? null;
}
