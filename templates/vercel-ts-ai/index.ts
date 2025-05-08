import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";
import { InteractionResponseType, MessageFlags } from "discord-api-types/v10";
import { InteractionType, verifyKey } from "discord-interactions";
import getRawBody from "raw-body";
import commands from "./.discraft/commands/index";
import { logger } from "./utils/logger";
import {
  type Command,
  type CommandExecuteUnpromised,
  type SimplifiedInteraction,
} from "./utils/types";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    logger.debug("Request received", { method: req.method, url: req.url });

    if (req.method !== "POST") {
      logger.warn("Method not allowed", { method: req.method });
      return res.status(405).send({ error: "Method Not Allowed" });
    }

    const signature = req.headers["x-signature-ed25519"];
    const timestamp = req.headers["x-signature-timestamp"];

    if (
      !signature ||
      !timestamp ||
      typeof signature !== "string" ||
      typeof timestamp !== "string"
    ) {
      logger.error("Invalid request headers", { signature, timestamp });
      return res.status(401).send({ error: "Invalid request headers" });
    }

    if (!process.env.DISCORD_PUBLIC_KEY) {
      logger.error("DISCORD_PUBLIC_KEY environment variable not set");
      return res
        .status(500)
        .send({ error: "Internal server configuration error" });
    }

    const rawBody = await getRawBody(req);

    if (!rawBody) {
      logger.error("Missing request body");
      return res.status(400).send({ error: "Missing request body" });
    }

    let isValidRequest = false;
    try {
      isValidRequest = await verifyKey(
        rawBody,
        signature,
        timestamp,
        process.env.DISCORD_PUBLIC_KEY,
      );
    } catch (err) {
      logger.error("Signature verification failed", {
        error: err,
        signature,
        timestamp,
      });
      return res.status(401).send({ error: "Invalid request signature" });
    }

    if (!isValidRequest) {
      logger.error("Invalid request signature", { signature, timestamp });
      return res.status(401).send({ error: "Invalid request signature" });
    }

    const message: SimplifiedInteraction = JSON.parse(rawBody.toString());
    logger.debug("Parsed message", { message });

    if (message.type === InteractionType.PING) {
      logger.debug("Handling Ping request");
      return res.status(200).json({ type: InteractionResponseType.Pong });
    } else if (message.type === InteractionType.APPLICATION_COMMAND) {
      const commandName = message.data.name.toLowerCase();
      logger.debug("Handling application command", { commandName });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const command: Command = (commands as any)[commandName];

      if (command) {
        // Immediately defer the command
        try {
          await axios.post(
            `https://discord.com/api/v10/interactions/${message.id}/${message.token}/callback`,
            {
              type: InteractionResponseType.DeferredChannelMessageWithSource,
              data: {
                flags: command.data.initialEphemeral
                  ? MessageFlags.Ephemeral
                  : 0,
              },
            },
            {
              headers: { "Content-Type": "application/json" },
            },
          );
        } catch (deferError) {
          logger.error("Failed to defer command", { deferError });
          return res.status(500).json({ error: "Failed to defer command" });
        }

        // Process the command asynchronously
        let commandResult: CommandExecuteUnpromised;
        try {
          commandResult = await command.execute({ interaction: message });
          logger.debug("Command executed successfully", { commandName });
        } catch (error) {
          logger.error("Error executing command", {
            commandName,
            error,
          });
          commandResult = {
            content: "An error occurred while processing your request.",
            flags: MessageFlags.Ephemeral,
          };
        }

        // PATCH the original response
        try {
          await axios.patch(
            `https://discord.com/api/v10/webhooks/${message.application_id}/${message.token}/messages/@original`,
            {
              content: commandResult.content ?? "",
              flags: commandResult.flags,
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
            },
          );
          logger.debug("Original response edited successfully");
        } catch (patchError) {
          logger.error("Failed to edit original response", {
            patchError,
          });
        }

        return;
      }

      logger.warn("Unknown command", { commandName });
      return res.status(400).json({ error: "Unknown Command" });
    } else {
      logger.warn("Unknown Interaction Type", { type: message.type });
      return res.status(400).json({ error: "Unknown Interaction Type" });
    }
  } catch (error) {
    logger.error("Error processing request", {
      error,
    });
    return res.status(500).json({
      error: "Failed to process request",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
