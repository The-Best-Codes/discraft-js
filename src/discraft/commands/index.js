import ping from '../../commands/ping.js';

// Export all commands in a map
export const commands = {
  [ping.data.name]: ping,
};