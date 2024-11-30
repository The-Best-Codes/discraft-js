import{Collection,REST,Routes}from"discord.js";import{error,info,debug,success}from"../../utils/logger.js";import{token,clientId}from"../../config/bot.config.js";import{commands}from"./index.js";import{commandCache}from"../../utils/commandCache.js";export class CommandHandler{constructor(e,t){this.client=e;this.commands=new Collection;this.commandsData=[];this.setupEventListeners();this.serverStartTime=t}setupEventListeners(){
// Handle command interactions
this.client.on("interactionCreate",(async e=>{if(!e.isCommand())return;const t=this.commands.get(e.commandName);if(!t)return;try{
// Check cache for command result if command is cacheable
if(t.cacheable){const t=commandCache.get(e.commandName,e.options.data);if(t){
// Handle cached multi-step responses
if(t.steps){
// Initial reply
await e.reply(t.steps[0]);
// Process subsequent steps
for(let a=1;a<t.steps.length;a++){const s=t.steps[a];if(s.type==="edit"){await e.editReply(s.content)}else if(s.type==="followUp"){await e.followUp(s.content)}if(a>100){error("Too many steps in cached response!");break}}return}
// Handle simple cached responses
await e.reply(t);return}}
// Execute command
const a=await t.execute(e);
// Cache the result if command is cacheable and returned a result
if(t.cacheable&&a){commandCache.set(e.commandName,e.options.data,a)}}catch(t){error("Error executing command:",t);const a={content:"There was an error executing this command!",ephemeral:true};try{if(e.replied||e.deferred){await e.followUp(a)}else{await e.reply(a)}}catch(e){error("Error replying:",e)}}}));
// Handle guild joins
this.client.on("guildCreate",(async e=>{debug(`Bot joined new guild: ${e.name} (${e.id})`);await this.registerCommands()}));
// Register commands when bot is ready
this.client.once("ready",(async()=>{debug("Registering commands...");await this.registerCommands();info(`Bot is ready as ${this.client.user.tag}`);debug(`Time to register commands: ${Date.now()-this.client.readyTimestamp}ms`);success(`Time to online: ${Date.now()-this.serverStartTime}ms`)}))}async loadCommands(){
// Clear existing commands
this.commands.clear();this.commandsData=[];
// Load commands from static imports
for(const[e,t]of Object.entries(commands)){if("data"in t&&"execute"in t){this.commands.set(t.data.name,t);this.commandsData.push(t.data.toJSON());debug(`Loaded command: ${t.data.name}`)}else{error(`The command ${e} is missing required "data" or "execute" property.`)}}}async registerCommands(){
// Reload commands to ensure we have the latest versions
await this.loadCommands();const e=(new REST).setToken(token);try{debug(`Started refreshing ${this.commandsData.length} application (/) commands.`);
// Register commands globally
const t=await e.put(Routes.applicationCommands(clientId),{body:this.commandsData});info(`Successfully reloaded ${t.length} application (/) commands.`)}catch(e){error("Error registering commands:",e)}}}