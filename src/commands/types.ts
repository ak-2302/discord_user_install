export interface CommandInteraction {
  type: number;
  data?: {
    name?: string;
    options?: Array<{ name: string; value: number | string }>;
  };
}

export interface DiscordCommand {
  name: string;
  description: string;
  options?: Array<Record<string, unknown>>;
}

export type CommandHandler = (interaction: CommandInteraction) => Response | null;
