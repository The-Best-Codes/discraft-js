import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('echo')
    .setDescription('Echoes your input')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('The message to echo')
        .setRequired(true))
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel to echo to')
        .setRequired(false))
    .addBooleanOption(option =>
      option.setName('ephemeral')
        .setDescription('Whether to show the echo only to you')
        .setRequired(false)),

  async execute(interaction) {
    const message = interaction.options.getString('message');
    const channel = interaction.options.getChannel('channel');
    const ephemeral = interaction.options.getBoolean('ephemeral') ?? false;

    if (channel) {
      await channel.send(message);
      await interaction.reply({ content: `Message sent to ${channel}!`, ephemeral: true });
    } else {
      await interaction.reply({ content: message, ephemeral });
    }
  },
};
