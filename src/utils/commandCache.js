import { debug } from "./logger.js";

class CommandCache {
  constructor(options = {}) {
    // Use LRU-style caching with Map for O(1) operations
    this.cache = new Map();

    // Customizable options with sensible defaults
    this.maxSize = options.maxSize || 100; // Maximum number of cached results
    this.defaultTTL = options.ttl || 60000; // Default TTL: 1 minute
    this.maxMemoryMB = options.maxMemoryMB || 50; // Maximum memory usage in MB

    // Command-specific cache settings
    this.commandSettings = new Map();

    // Start periodic cleanup
    this.startCleanupInterval();
  }

  /**
   * Get cached result for a command
   */
  get(commandName, args) {
    const key = this.generateKey(commandName, args);
    const cached = this.cache.get(key);

    if (!cached) {
      debug(`Cache miss for command: ${commandName}`);
      return null;
    }

    // Check if entry has expired
    if (Date.now() > cached.expiry) {
      debug(`Cache entry expired for command: ${commandName}`);
      this.cache.delete(key);
      return null;
    }

    debug(`Cache hit for command: ${commandName}`);
    return cached.value;
  }

  /**
   * Store command result in cache
   */
  set(commandName, args, value) {
    // Get command-specific settings or defaults
    const settings = this.commandSettings.get(commandName) || {
      ttl: this.defaultTTL,
    };

    // Check memory usage before caching
    const estimatedSize = this.getObjectSize(value);
    if (
      this.getCurrentMemoryUsage() + estimatedSize >
      this.maxMemoryMB * 1024 * 1024
    ) {
      debug(`Skipping cache due to memory limits: ${commandName}`);
      return false;
    }

    // Enforce max size using LRU
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    const key = this.generateKey(commandName, args);
    this.cache.set(key, {
      value,
      expiry: Date.now() + settings.ttl,
      size: estimatedSize,
    });

    debug(`Cached result for command: ${commandName} (${estimatedSize} bytes)`);
    return true;
  }

  /**
   * Configure cache settings for specific commands
   */
  setCommandSettings(commandName, settings) {
    this.commandSettings.set(commandName, {
      ttl: settings.ttl || this.defaultTTL,
    });
  }

  /**
   * Generate unique cache key
   */
  generateKey(commandName, args) {
    // Sort args to ensure consistent keys regardless of argument order
    const sortedArgs = args
      ? JSON.stringify(args, Object.keys(args).sort())
      : "";
    return `${commandName}:${sortedArgs}`;
  }

  /**
   * Clear expired entries and check memory usage
   */
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Start periodic cleanup
   */
  startCleanupInterval() {
    setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }

  /**
   * Estimate object size in bytes
   */
  getObjectSize(obj) {
    const str = JSON.stringify(obj);
    // Approximate size in bytes (2 bytes per character in UTF-16)
    return str.length * 2;
  }

  /**
   * Get current memory usage of cache
   */
  getCurrentMemoryUsage() {
    let total = 0;
    // eslint-disable-next-line no-unused-vars
    for (const [_, value] of this.cache.entries()) {
      total += value.size;
    }
    return total;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      memoryUsage: `${(this.getCurrentMemoryUsage() / (1024 * 1024)).toFixed(
        2
      )}MB`,
      maxMemory: `${this.maxMemoryMB}MB`,
    };
  }
}

// Export singleton instance
export const commandCache = new CommandCache({
  maxSize: 200, // 200 cache entries
  ttl: 120000, // 2 minutes
  maxMemoryMB: 100, // 100MB memory limit
});
