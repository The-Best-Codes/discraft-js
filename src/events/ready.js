import { debug, error } from "../utils/logger.js";
import { ActivityType, Events } from "discord.js";

export default (client) => {
    client.on(Events.ClientReady, () => {
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
