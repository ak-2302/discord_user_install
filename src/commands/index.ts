import * as ping from "./ping";
import type { CommandHandler, DiscordCommand } from "./types";

export const definitions: DiscordCommand[] = [ping.definition];

const handlers = new Map<string, CommandHandler>([[ping.definition.name, ping.handle]]);

export function handleCommand(name: string | undefined, interaction: Parameters<CommandHandler>[0]): Response | null {
  return handlers.get(name ?? "")?.(interaction) ?? null;
}
