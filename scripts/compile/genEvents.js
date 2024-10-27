import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { info, debug, error } from '../../common/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function generateEvents() {
    try {
        debug('Generating events/index.js...');
        const EVENTS_DIR = path.join(__dirname, '../../src/events');
        const OUTPUT_FILE = path.join(EVENTS_DIR, 'index.js');

        // Get all event files
        const eventFiles = fs.readdirSync(EVENTS_DIR)
            .filter(file => file.endsWith('.js') && file !== 'index.js');

        // Generate the content
        let content = '';

        // Add imports
        eventFiles.forEach(file => {
            const eventName = path.basename(file, '.js');
            content += `import ${eventName} from './${file}';\n`;
        });

        content += '\n// Export all events with their handlers\n';
        content += 'export const events = {\n';

        // Add event exports
        eventFiles.forEach(file => {
            const eventName = path.basename(file, '.js');
            content += `  ${eventName},\n`;
        });

        content += '};';

        // Write the file
        fs.writeFileSync(OUTPUT_FILE, content);
        info('Generated events/index.js');
    } catch (err) {
        error('Error generating events/index.js:', err);
    }
}