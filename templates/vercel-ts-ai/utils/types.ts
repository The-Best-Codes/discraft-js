import { InteractionType } from "discord-interactions";

// Define a simplified interaction type that has just the data we need for command execution
export interface SimplifiedInteraction {
  type: InteractionType;
  data: {
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
    };
  };
  id: string;
  channel_id: string;
  member: {
    user: {
      id: string;
      username: string;
      avatar: string;
      discriminator: string;
      public_flags: number;
    };
  };
}
