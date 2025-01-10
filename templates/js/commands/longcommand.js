import { MessageFlags, SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("longcommand")
    .setDescription("A command that takes some time and edits the reply."),

  async execute(data) {
    const interaction = data.interaction;

    await interaction.deferReply();

    await new Promise((resolve) => setTimeout(resolve, 2000));
    await interaction.editReply({ content: "Processing..." });

    await new Promise((resolve) => setTimeout(resolve, 2000));
    await interaction.editReply({ content: "Almost done..." });

    await new Promise((resolve) => setTimeout(resolve, 2000));
    await interaction.editReply({ content: "Done!" });
    await interaction.followUp({
      content: "Command Completed!",
      flags: MessageFlags.Ephemeral,
    });
  },
};
