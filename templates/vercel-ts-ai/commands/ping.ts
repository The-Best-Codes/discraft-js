import { type SimplifiedInteraction } from "../utils/types";

export default {
  data: {
    name: "ping",
    description: "Check if the bot is online",
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(data: { interaction: SimplifiedInteraction }) {
    return {
      type: 4,
      data: {
        content: "Pong from Vercel!",
      },
    };
  },
};
