import { error } from "../utils/logger.js";

export default (client) => {
    client.on("error", (err) => {
        error("Discord client error:", err);
    });
};