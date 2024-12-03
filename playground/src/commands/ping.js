import { SlashCommandBuilder } from "discord.js";
import { commandCache } from "../utils/commandCache.js";

// Set command-specific cache settings
commandCache.setCommandSettings("ping", {
  ttl: 5000, // Cache ping results for 5 seconds
});

export default {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong"),

  // Enable caching for this command
  cacheable: true,

  async execute(interaction) {
    const sent = await interaction.reply({
      content: "Pinging...",
      fetchReply: true,
    });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const response = `Pong!\nLatency: ${latency}ms\nWS Ping: ${Math.round(
      interaction.client.ws.ping
    )}ms`;

    // Edit the reply and return the response for caching
    await interaction.editReply(response);
    return { content: response }; // Return in a format that can be used by interaction.reply()
  },
};
