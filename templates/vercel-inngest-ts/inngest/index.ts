import axios from "axios";
import { MessageFlags } from "discord-api-types/v10";
import { serve } from "inngest/next";
import commands from "../.discraft/commands/index";
import type { Command } from "../utils/types";
import { inngest } from "./instance";

// Function to handle Discord commands
const handleCommand = inngest.createFunction(
  { id: "discord-command-handler" },
  { event: "discord/command.execute" },
  async ({ event, step }) => {
    const { interaction, commandName } = event.data;

    console.log(`Processing command: ${commandName}`);

    // Get the command handler
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const command: Command = (commands as any)[commandName];

    if (!command) {
      console.error(`Unknown command: ${commandName}`);
      return {
        error: "Unknown command",
        status: "failed",
      };
    }

    // Execute the command with retry capability
    const result = await step.run(`execute-${commandName}`, async () => {
      try {
        return await command.execute({ interaction });
      } catch (error) {
        console.error(`Error executing command ${commandName}:`, error);
        return {
          content: "An error occurred while processing your request.",
          flags: MessageFlags.Ephemeral,
        };
      }
    });

    // Update the Discord message with the result
    await step.run("update-discord-message", async () => {
      try {
        await axios.patch(
          `https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`,
          {
            content: result.content ?? "",
            flags: result.flags,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
        console.log("Discord message updated successfully");
        return { status: "success" };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error("Failed to update Discord message:", error);
        return {
          status: "failed",
          error: error.message,
        };
      }
    });

    return {
      status: "success",
      result,
    };
  },
);

export default serve({
  client: inngest,
  functions: [handleCommand],
});
