import { ActivityType, Client, Events } from "discord.js";

export default {
  eventData: Events.ClientReady,

  async execute(data: { client: Client }) {
    const client = data.client;
    client.user.setPresence({
      activities: [
        {
          name: "Discraft",
          state: "Created with Discraft",
          type: ActivityType.Custom,
        },
      ],
      status: "online",
    });
  },
};
