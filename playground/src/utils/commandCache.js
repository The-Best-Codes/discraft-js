import{debug}from"./logger.js";class CommandCache{constructor(e={}){
// Use LRU-style caching with Map for O(1) operations
this.cache=new Map;
// Customizable options with sensible defaults
this.maxSize=e.maxSize||100;// Maximum number of cached results
this.defaultTTL=e.ttl||6e4;// Default TTL: 1 minute
this.maxMemoryMB=e.maxMemoryMB||50;// Maximum memory usage in MB
// Command-specific cache settings
this.commandSettings=new Map;
// Start periodic cleanup
this.startCleanupInterval()}
/**
   * Get cached result for a command
   */get(e,t){const s=this.generateKey(e,t);const a=this.cache.get(s);if(!a){debug(`Cache miss for command: ${e}`);return null}
// Check if entry has expired
if(Date.now()>a.expiry){debug(`Cache entry expired for command: ${e}`);this.cache.delete(s);return null}debug(`Cache hit for command: ${e}`);return a.value}
/**
   * Store command result in cache
   */set(e,t,s){
// Get command-specific settings or defaults
const a=this.commandSettings.get(e)||{ttl:this.defaultTTL};
// Check memory usage before caching
const i=this.getObjectSize(s);if(this.getCurrentMemoryUsage()+i>this.maxMemoryMB*1024*1024){debug(`Skipping cache due to memory limits: ${e}`);return false}
// Enforce max size using LRU
if(this.cache.size>=this.maxSize){const e=this.cache.keys().next().value;this.cache.delete(e)}const r=this.generateKey(e,t);this.cache.set(r,{value:s,expiry:Date.now()+a.ttl,size:i});debug(`Cached result for command: ${e} (${i} bytes)`);return true}
/**
   * Configure cache settings for specific commands
   */setCommandSettings(e,t){this.commandSettings.set(e,{ttl:t.ttl||this.defaultTTL})}
/**
   * Generate unique cache key
   */generateKey(e,t){
// Sort args to ensure consistent keys regardless of argument order
const s=t?JSON.stringify(t,Object.keys(t).sort()):"";return`${e}:${s}`}
/**
   * Clear expired entries and check memory usage
   */cleanup(){const e=Date.now();for(const[t,s]of this.cache.entries()){if(e>s.expiry){this.cache.delete(t)}}}
/**
   * Start periodic cleanup
   */startCleanupInterval(){setInterval((()=>this.cleanup()),6e4);// Cleanup every minute
}
/**
   * Estimate object size in bytes
   */getObjectSize(e){const t=JSON.stringify(e);
// Approximate size in bytes (2 bytes per character in UTF-16)
return t.length*2}
/**
   * Get current memory usage of cache
   */getCurrentMemoryUsage(){let e=0;
// eslint-disable-next-line no-unused-vars
for(const[t,s]of this.cache.entries()){e+=s.size}return e}
/**
   * Get cache statistics
   */getStats(){return{size:this.cache.size,maxSize:this.maxSize,memoryUsage:`${(this.getCurrentMemoryUsage()/(1024*1024)).toFixed(2)}MB`,maxMemory:`${this.maxMemoryMB}MB`}}}
// Export singleton instance
export const commandCache=new CommandCache({maxSize:200,// 200 cache entries
ttl:12e4,// 2 minutes
maxMemoryMB:100});