import { SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("random")
    .setDescription("Generate random numbers or pick random items")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("number")
        .setDescription("Generate a random number")
        .addIntegerOption((option) =>
          option
            .setName("min")
            .setDescription("Minimum number (default: 1)")
            .setRequired(false)
        )
        .addIntegerOption((option) =>
          option
            .setName("max")
            .setDescription("Maximum number (default: 100)")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("pick")
        .setDescription("Pick a random item from a list")
        .addStringOption((option) =>
          option
            .setName("items")
            .setDescription("Comma-separated list of items to choose from")
            .setRequired(true)
        )
    ),

  // Disable caching for this command
  cacheable: false,

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "number") {
      const min = interaction.options.getInteger("min") ?? 1;
      const max = interaction.options.getInteger("max") ?? 100;

      if (min >= max) {
        await interaction.reply({
          content:
            "❌ The minimum number must be less than the maximum number!",
          ephemeral: true,
        });
        return;
      }

      const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
      await interaction.reply({
        content: `🎲 Your random number between ${min} and ${max} is: **${randomNum}**`,
      });
    } else if (subcommand === "pick") {
      const items = interaction.options
        .getString("items")
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      if (items.length === 0) {
        await interaction.reply({
          content: "❌ Please provide at least one item to choose from!",
          ephemeral: true,
        });
        return;
      }

      const randomItem = items[Math.floor(Math.random() * items.length)];
      await interaction.reply({
        content: `🎯 I randomly picked: **${randomItem}**\n*(from ${items.length} items)*`,
      });
    }
  },
};
