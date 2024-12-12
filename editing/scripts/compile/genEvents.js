import fs from "fs";
import path from "path";
import { debug, error, info } from "../../common/utils/logger.js";

export default function generateEvents(srcDir) {
  try {
    debug("Generating discraft/events/index.js...");
    const EVENTS_DIR = path.join(srcDir, "events");
    const OUTPUT_DIR = path.join(srcDir, "discraft", "events");
    const OUTPUT_FILE = path.join(OUTPUT_DIR, "index.js");

    // Create discraft directory if it doesn't exist
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Get all event files from the original events directory
    const eventFiles = fs
      .readdirSync(EVENTS_DIR)
      .filter((file) => file.endsWith(".js") && file !== "index.js");

    // Generate the content
    let content = "";

    if (eventFiles.length === 0) {
      content = "// No events found\nexport const events = {};\n";
    } else {
      // Add imports (from original events directory)
      eventFiles.forEach((file) => {
        const eventName = path.basename(file, ".js");
        content += `import ${eventName} from '../../events/${file}';\n`;
      });

      content += "\n// Export all events with their handlers\n";
      content += "export const events = {\n";

      // Add event exports
      eventFiles.forEach((file) => {
        const eventName = path.basename(file, ".js");
        content += `  ${eventName},\n`;
      });

      content += "};";
    }

    // Write the file to discraft directory
    fs.writeFileSync(OUTPUT_FILE, content);
    info("Generated discraft/events/index.js");
  } catch (err) {
    error("Error generating discraft/events/index.js:", err);
  }
}
