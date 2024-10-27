import { debug, error } from "../../common/utils/logger.js";
import { ActivityType } from "discord.js";

export default (client) => {
    client.on('ready', () => {
        debug('Setting presence...');
        try {
            client.user.setPresence({
                activities: [{ name: 'Discraft', emoji: '', state: 'Created with Discraft', type: ActivityType.Custom }],
                status: 'online'
            });
        } catch (err) {
            error('Error setting presence:', err);
        }
    });
}