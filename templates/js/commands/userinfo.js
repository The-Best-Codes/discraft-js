import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  MessageFlags,
} from "discord.js";

// Right click on a user and select "Apps" and then "Show User Info"
// to use this command

export default {
  data: new ContextMenuCommandBuilder()
    .setName("Show User Info")
    .setType(ApplicationCommandType.User), // Set type to User

  async execute(data) {
    const interaction = data.interaction;
    const user = interaction.targetUser; // Get the user from the interaction

    await interaction.deferReply({ flags: MessageFlags.Ephemeral }); // Defer and make ephemeral

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const embed = {
      title: `User Info for ${user.tag}`,
      fields: [
        {
          name: "ID",
          value: user.id,
        },
        {
          name: "Created At",
          value: user.createdAt.toLocaleString(),
        },
        {
          name: "Bot?",
          value: user.bot ? "Yes" : "No",
        },
        {
          name: "Avatar URL",
          value: user.displayAvatarURL(),
        },
        {
          name: "Global Name",
          value: user.globalName || "Not Set",
        },
      ],
      thumbnail: {
        url: user.displayAvatarURL(),
      },
    };

    await interaction.editReply({
      content: "Here's some info:",
      embeds: [embed],
    });
  },
};
