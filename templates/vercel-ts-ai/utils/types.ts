import { InteractionType } from "discord-interactions";
import type {
  MessageFlags,
  RESTPostAPIApplicationCommandsJSONBody,
} from "discord.js";

export interface SimplifiedInteraction {
  type: InteractionType;
  data: {
    id: string;
    name: string;
    options?: { name: string; type: number; value: string }[];
    resolved?: {
      attachments?: {
        [key: string]: {
          id: string;
          filename: string;
          size: number;
          url: string;
          proxy_url: string;
          content_type: string;
        };
      };
      users?: {
        [key: string]: {
          id: string;
          username: string;
          avatar: string;
          discriminator: string;
          public_flags: number;
        };
      };
      channels?: {
        [key: string]: {
          id: string;
          name: string;
          type: number;
          permissions: string;
        };
      };
      roles?: {
        [key: string]: {
          id: string;
          name: string;
          permissions: string;
        };
      };
    };
    type: number;
  };
  id: string;
  channel_id: string;
  application_id: string;
  token: string;
  member: {
    user: {
      id: string;
      username: string;
      avatar: string;
      discriminator: string;
      public_flags: number;
    };
    permissions: string;
  };
  guild_id: string;
  locale: string;
  guild_locale: string;
}

export type CommandExecuteUnpromised = {
  content: string;
  flags?: MessageFlags;
};

export type CommandExecuteResult = Promise<CommandExecuteUnpromised>;

export type CommandExecute = (data: {
  interaction: SimplifiedInteraction;
}) => CommandExecuteResult;

export type CommandData = RESTPostAPIApplicationCommandsJSONBody & {
  initialEphemeral?: boolean | undefined;
};

export interface Command {
  data: CommandData;
  execute: CommandExecute;
}
