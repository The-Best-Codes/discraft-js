import ping from '../../commands/ping.js';
import random from '../../commands/random.js';
import status from '../../commands/status.js';

// Export all commands in a map
export const commands = {
  [ping.data.name]: ping,
  [random.data.name]: random,
  [status.data.name]: status,
};