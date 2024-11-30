import { debug, error, info } from '../../utils/logger.js';
import { events } from './index.js';

export async function eventHandler(client) {
  // Load events from static imports
  info('Loading events...');
  try {
    for (const [name, eventHandler] of Object.entries(events)) {
      debug(`Loading event: ${name}`);
      try {
        eventHandler(client);
        debug(`Loaded event: ${name}`);
      } catch (err) {
        error(`Error loading event ${name}:`, err);
      }
    }
    info('Events loaded.');
  } catch (err) {
    error('Error loading events:', err);
  }
}
