import { consola as logger } from "consola";
import { promises as fs } from "fs";
import { glob } from "glob";
import path from "path";

import { buildCommandsJsIndex } from "./builders/commands.js.builder";
import { buildCommandsTsIndex } from "./builders/commands.ts.builder";
import type { ModuleInfo } from "./types";

const CWD = process.cwd();
const COMMANDS_DIR = path.join(CWD, "commands");
const DISCRAFT_DIR = path.join(CWD, ".discraft");

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, "");
}

async function findModules(extension: string): Promise<ModuleInfo[]> {
  try {
    // Use normalized path for glob pattern and ensure proper Windows compatibility
    const pattern = path.normalize(path.join(COMMANDS_DIR, `*.${extension}`));
    logger.verbose(`Looking for command files with pattern: ${pattern}`);
    
    const files = await glob(pattern, { windowsPathsNoEscape: true });
    
    if (files.length === 0) {
      logger.verbose(`No command files found matching ${pattern}`);
    } else {
      logger.verbose(`Found ${files.length} command files`);
    }
    
    return files.map((filePath) => {
      const fileName = path.basename(filePath, `.${extension}`);
      const sanitizedName = sanitizeName(fileName);

      if (sanitizedName !== fileName) {
        logger.warn(
          `Filename "${fileName}" has invalid characters, using "${sanitizedName}" instead.`,
        );
      }
      
      const targetPath = path.join(DISCRAFT_DIR, "commands", `index.${extension}`);
      const targetDir = path.dirname(targetPath);
      
      // Compute relative path and ensure forward slashes for imports
      let importPath = path.relative(targetDir, filePath);
      importPath = importPath.replace(/\\/g, "/");
      importPath = importPath.replace(new RegExp(`\\.${extension}$`), "");
      
      logger.verbose(`Generated import path for ${fileName}: ${importPath}`);

      return {
        name: sanitizedName,
        importPath,
        isValid: true,
      };
    });
  } catch (err) {
    logger.error(`Error finding files in ${COMMANDS_DIR}.`, err);
    logger.verbose(`Error details: ${err}`);
    return [];
  }
}

async function generateCommandsIndex(extension: "ts" | "js") {
  const OUTPUT_COMMANDS_FILE = path.join(
    DISCRAFT_DIR,
    "commands",
    `index.${extension}`,
  );

  try {
    // Ensure commands directory exists in source location too
    await fs.mkdir(COMMANDS_DIR, { recursive: true });
  } catch (err) {
    logger.verbose(`Note: Commands directory already exists or couldn't be created: ${err}`);
  }
  
  const modules = await findModules(extension);
  if (!modules.length) {
    logger.warn("No command files found. Skipping command index generation.");
    const content = `
import { Client } from "discord.js";
import { logger } from "../../utils/logger";

export async function registerCommands(client) {
    logger.warn("No commands found in commands directory");
    return;
}
        `;
    await fs.writeFile(OUTPUT_COMMANDS_FILE, content);
    return;
  }

  let content = "";
  if (extension === "ts") {
    logger.verbose("Generating commands index file for typescript");
    content = buildCommandsTsIndex(modules);
  } else if (extension === "js") {
    logger.verbose("Generating commands index file for javascript");
    content = buildCommandsJsIndex(modules);
  }

  await fs.writeFile(OUTPUT_COMMANDS_FILE, content);
  logger.verbose("Commands index file generated.");
}

export { generateCommandsIndex };
