export interface CommandInteraction {
  type: number;
  data?: { name?: string };
}

export interface DiscordCommand {
  name: string;
  description: string;
}

export type CommandHandler = (interaction: CommandInteraction) => Response | null;
