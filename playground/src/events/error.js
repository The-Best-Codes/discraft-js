import { error } from "../utils/logger.js";
import { Events } from "discord.js";

export default (client) => {
    client.on(Events.Error, (err) => {
        error("Discord client error:", err);
    });
};