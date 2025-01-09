import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  MessageContextMenuCommandInteraction,
  MessageFlags,
} from "discord.js";

// Right click on a message and select "Apps" and then "Show Message Content"
// to use this command

export default {
  data: new ContextMenuCommandBuilder()
    .setName("Show Message Content")
    .setType(ApplicationCommandType.Message),

  async execute(data: { interaction: MessageContextMenuCommandInteraction }) {
    const interaction = data.interaction;
    const message = interaction.targetMessage;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const embed = {
      title: `Message Content`,
      description: message.content || "No message content",
      fields: [
        {
          name: "Author",
          value: message.author.tag,
        },
        {
          name: "ID",
          value: message.id,
        },
        {
          name: "Created At",
          value: message.createdAt.toLocaleString(),
        },
      ],
      footer: {
        text: `Message ID: ${message.id}`,
      },
    };

    await interaction.editReply({
      content: "Here's the message content:",
      embeds: [embed],
    });
  },
};
