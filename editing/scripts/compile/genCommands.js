import fs from "fs";
import path from "path";
import { info, debug, error } from "../../common/utils/logger.js";

export default function generateCommands(srcDir) {
    try {
        debug("Generating discraft/commands/index.js...");
        const COMMANDS_DIR = path.join(srcDir, "commands");
        const OUTPUT_DIR = path.join(srcDir, "discraft", "commands");
        const OUTPUT_FILE = path.join(OUTPUT_DIR, "index.js");

        // Create discraft directory if it doesn't exist
        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        }

        // Get all command files from the original commands directory
        const commandFiles = fs.readdirSync(COMMANDS_DIR)
            .filter(file => file.endsWith(".js") && file !== "index.js");

        // Generate the content
        let content = "";

        // Add imports (from original commands directory)
        commandFiles.forEach(file => {
            const commandName = path.basename(file, ".js");
            content += `import ${commandName} from '../../commands/${file}';\n`;
        });

        content += "\n// Export all commands in a map\n";
        content += "export const commands = {\n";

        // Add command exports
        commandFiles.forEach(file => {
            const commandName = path.basename(file, ".js");
            content += `  [${commandName}.data.name]: ${commandName},\n`;
        });

        content += "};";

        // Write the file to discraft directory
        fs.writeFileSync(OUTPUT_FILE, content);
        info("Generated discraft/commands/index.js");
    } catch (err) {
        error("Error generating discraft/commands/index.js:", err);
    }
}
