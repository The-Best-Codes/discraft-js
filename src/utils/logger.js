import{logLevel as t}from"../config/bot.config.js";const o={silent:Number.NEGATIVE_INFINITY,fatal:0,error:0,warn:1,log:2,info:3,success:3,fail:3,ready:3,start:3,box:3,debug:4,trace:5,verbose:Number.POSITIVE_INFINITY},e={silent:{level:-1},fatal:{level:o.fatal},error:{level:o.error},warn:{level:o.warn},log:{level:o.log},info:{level:o.info},success:{level:o.success},fail:{level:o.fail},ready:{level:o.info},start:{level:o.info},box:{level:o.info},debug:{level:o.debug},trace:{level:o.trace},verbose:{level:o.verbose}};function s(t){return null!==t&&"object"==typeof t}function r(t,o,e=".",i){if(!s(o))return r(t,{},e);const n=Object.assign({},o);for(const o in t){if("__proto__"===o||"constructor"===o)continue;const i=t[o];null!=i&&(Array.isArray(i)&&Array.isArray(n[o])?n[o]=[...i,...n[o]]:s(i)&&s(n[o])?n[o]=r(i,n[o],(e?`${e}.`:"")+o.toString()):n[o]=i)}return n}const i=(...t)=>t.reduce(((t,o)=>r(t,o,"")),{});function n(t){return o=t,"[object Object]"===Object.prototype.toString.call(o)&&(!(!t.message&&!t.args)&&!t.stack);var o}let l=!1;const p=[];class a{constructor(t={}){const o=t.types||e;this.options=i({...t,defaults:{...t.defaults},level:c(t.level,o),reporters:[...t.reporters||[]]},{types:e,throttle:1e3,throttleMin:5,formatOptions:{date:!0,colors:!1,compact:!0}});for(const t in o){const e={type:t,...this.options.defaults,...o[t]};this[t]=this._wrapLogFn(e),this[t].raw=this._wrapLogFn(e,!0)}this.options.mockFn&&this.mockTypes(),this._lastLog={}}get level(){return this.options.level}set level(t){this.options.level=c(t,this.options.types,this.options.level)}prompt(t,o){if(!this.options.prompt)throw new Error("prompt is not supported!");return this.options.prompt(t,o)}create(t){const o=new a({...this.options,...t});return this._mockFn&&o.mockTypes(this._mockFn),o}withDefaults(t){return this.create({...this.options,defaults:{...this.options.defaults,...t}})}withTag(t){return this.withDefaults({tag:this.options.defaults.tag?this.options.defaults.tag+":"+t:t})}addReporter(t){return this.options.reporters.push(t),this}removeReporter(t){if(t){const o=this.options.reporters.indexOf(t);if(o>=0)return this.options.reporters.splice(o,1)}else this.options.reporters.splice(0);return this}setReporters(t){return this.options.reporters=Array.isArray(t)?t:[t],this}wrapAll(){this.wrapConsole(),this.wrapStd()}restoreAll(){this.restoreConsole(),this.restoreStd()}wrapConsole(){for(const t in this.options.types)console["__"+t]||(console["__"+t]=console[t]),console[t]=this[t].raw}restoreConsole(){for(const t in this.options.types)console["__"+t]&&(console[t]=console["__"+t],delete console["__"+t])}wrapStd(){this._wrapStream(this.options.stdout,"log"),this._wrapStream(this.options.stderr,"log")}_wrapStream(t,o){t&&(t.__write||(t.__write=t.write),t.write=t=>{this[o].raw(String(t).trim())})}restoreStd(){this._restoreStream(this.options.stdout),this._restoreStream(this.options.stderr)}_restoreStream(t){t&&t.__write&&(t.write=t.__write,delete t.__write)}pauseLogs(){l=!0}resumeLogs(){l=!1;const t=p.splice(0);for(const o of t)o[0]._logFn(o[1],o[2])}mockTypes(t){const o=t||this.options.mockFn;if(this._mockFn=o,"function"==typeof o)for(const t in this.options.types)this[t]=o(t,this.options.types[t])||this[t],this[t].raw=this[t]}_wrapLogFn(t,o){return(...e)=>{if(!l)return this._logFn(t,e,o);p.push([this,t,e,o])}}_logFn(t,o,e){if((t.level||0)>this.level)return!1;const s={date:new Date,args:[],...t,level:c(t.level,this.options.types)};!e&&1===o.length&&n(o[0])?Object.assign(s,o[0]):s.args=[...o],s.message&&(s.args.unshift(s.message),delete s.message),s.additional&&(Array.isArray(s.additional)||(s.additional=s.additional.split("\n")),s.args.push("\n"+s.additional.join("\n")),delete s.additional),s.type="string"==typeof s.type?s.type.toLowerCase():"log",s.tag="string"==typeof s.tag?s.tag:"";const r=(t=!1)=>{const o=(this._lastLog.count||0)-this.options.throttleMin;if(this._lastLog.object&&o>0){const t=[...this._lastLog.object.args];o>1&&t.push(`(repeated ${o} times)`),this._log({...this._lastLog.object,args:t}),this._lastLog.count=1}t&&(this._lastLog.object=s,this._log(s))};clearTimeout(this._lastLog.timeout);const i=this._lastLog.time&&s.date?s.date.getTime()-this._lastLog.time.getTime():0;if(this._lastLog.time=s.date,i<this.options.throttle)try{const t=JSON.stringify([s.type,s.tag,s.args]),o=this._lastLog.serialized===t;if(this._lastLog.serialized=t,o&&(this._lastLog.count=(this._lastLog.count||0)+1,this._lastLog.count>this.options.throttleMin))return void(this._lastLog.timeout=setTimeout(r,this.options.throttle))}catch{}r(!0)}_log(t){for(const o of this.options.reporters)o.log(t,{options:this.options})}}function c(t,o={},e=3){return void 0===t?e:"number"==typeof t?t:o[t]&&void 0!==o[t].level?o[t].level:e}a.prototype.add=a.prototype.addReporter,a.prototype.remove=a.prototype.removeReporter,a.prototype.clear=a.prototype.removeReporter,a.prototype.withScope=a.prototype.withTag,a.prototype.mock=a.prototype.mockTypes,a.prototype.pause=a.prototype.pauseLogs,a.prototype.resume=a.prototype.resumeLogs;class h{constructor(t){this.options={...t},this.defaultColor="#7f8c8d",this.levelColorMap={0:"#c0392b",1:"#f39c12",3:"#00BCD4"},this.typeColorMap={success:"#2ecc71"}}_getLogFn(t){return t<1?console.__error||console.error:1===t?console.__warn||console.warn:console.__log||console.log}log(t){const o=this._getLogFn(t.level),e="log"===t.type?"":t.type,s=t.tag||"",r=`\n      background: ${this.typeColorMap[t.type]||this.levelColorMap[t.level]||this.defaultColor};\n      border-radius: 0.5em;\n      color: white;\n      font-weight: bold;\n      padding: 2px 0.5em;\n    `,i=`%c${[s,e].filter(Boolean).join(":")}`;"string"==typeof t.args[0]?o(`${i}%c ${t.args[0]}`,r,"",...t.args.slice(1)):o(i,r,...t.args)}}const g=function(t={}){return function(t={}){return new a(t)}({reporters:t.reporters||[new h({})],prompt:(t,o={})=>"confirm"===o.type?Promise.resolve(confirm(t)):Promise.resolve(prompt(t)),...t})}(),u=g.log,f=g.info,_=g.warn,d=g.error,m=g.trace,y=g.success,v=(o,...e)=>{"debug"===t&&g.debug(o,...e)};export{v as debug,d as error,f as info,u as log,y as success,m as trace,_ as warn};