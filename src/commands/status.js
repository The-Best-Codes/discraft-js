import { SlashCommandBuilder } from "discord.js";
import { commandCache } from "../utils/commandCache.js";

// Set command-specific cache settings
commandCache.setCommandSettings('status', {
    ttl: 30000  // Cache status for 30 seconds
});

export default {
    data: new SlashCommandBuilder()
        .setName("status")
        .setDescription("Check the bot and server status"),
    
    cacheable: true,

    async execute(interaction) {
        // Initial reply
        await interaction.reply({ content: "📊 Gathering status information..." });
        
        // Simulate gathering different types of status info
        const botStatus = {
            uptime: Math.floor(interaction.client.uptime / 1000) + 's',
            ping: Math.round(interaction.client.ws.ping) + 'ms'
        };
        
        // Edit the initial reply with bot status
        await interaction.editReply({
            content: `🤖 **Bot Status**\nUptime: ${botStatus.uptime}\nPing: ${botStatus.ping}`
        });
        
        // Add server status as a follow-up
        const serverStatus = {
            members: interaction.guild.memberCount,
            channels: interaction.guild.channels.cache.size
        };
        
        await interaction.followUp({
            content: `🌐 **Server Status**\nMembers: ${serverStatus.members}\nChannels: ${serverStatus.channels}`
        });

        // Return all steps for caching
        return {
            steps: [
                // Initial reply
                { content: "📊 Gathering status information..." },
                
                // Edit step
                {
                    type: 'edit',
                    content: `🤖 **Bot Status**\nUptime: ${botStatus.uptime}\nPing: ${botStatus.ping}`
                },
                
                // Follow-up step
                {
                    type: 'followUp',
                    content: `🌐 **Server Status**\nMembers: ${serverStatus.members}\nChannels: ${serverStatus.channels}`
                }
            ]
        };
    },
};
