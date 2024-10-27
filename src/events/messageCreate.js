export default (client) => {
  client.on('messageCreate', async (message) => {
    // Ignore messages from bots to prevent potential loops
    if (message.author.bot) return;
    
    // Example: Reply to messages containing "hello"
    if (message.content.toLowerCase().includes('hello')) {
      await message.reply('Hello there! 👋');
    }
  });
};
