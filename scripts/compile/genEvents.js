import fs from"fs";import path from"path";import{debug,error,info}from"../../common/utils/logger.js";export default function generateEvents(e){try{debug("Generating discraft/events/index.js...");const n=path.join(e,"events"),t=path.join(e,"discraft","events"),s=path.join(t,"index.js");fs.existsSync(t)||fs.mkdirSync(t,{recursive:!0});const r=fs.readdirSync(n).filter((e=>e.endsWith(".js")&&"index.js"!==e));let o="";0===r.length?o="// No events found\nexport const events = {};\n":(r.forEach((e=>{const n=path.basename(e,".js");o+=`import ${n} from '../../events/${e}';\n`})),o+="\n// Export all events with their handlers\n",o+="export const events = {\n",r.forEach((e=>{const n=path.basename(e,".js");o+=`  ${n},\n`})),o+="};"),fs.writeFileSync(s,o),info("Generated discraft/events/index.js")}catch(e){error("Error generating discraft/events/index.js:",e)}}