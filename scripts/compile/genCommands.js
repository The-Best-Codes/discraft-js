import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { info, debug, error } from '../../common/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function generateCommands() {
    try {
        debug('Generating commands/index.js...');
        const COMMANDS_DIR = path.join(__dirname, '../../src/commands');
        const OUTPUT_FILE = path.join(COMMANDS_DIR, 'index.js');

        // Get all command files
        const commandFiles = fs.readdirSync(COMMANDS_DIR)
            .filter(file => file.endsWith('.js') && file !== 'index.js');

        // Generate the content
        let content = '';

        // Add imports
        commandFiles.forEach(file => {
            const commandName = path.basename(file, '.js');
            content += `import ${commandName} from './${file}';\n`;
        });

        content += '\n// Export all commands in a map\n';
        content += 'export const commands = {\n';

        // Add command exports
        commandFiles.forEach(file => {
            const commandName = path.basename(file, '.js');
            content += `  [${commandName}.data.name]: ${commandName},\n`;
        });

        content += '};';

        // Write the file
        fs.writeFileSync(OUTPUT_FILE, content);
        info('Generated commands/index.js');
    } catch (err) {
        error('Error generating commands/index.js:', err);
    }
}