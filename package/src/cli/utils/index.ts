import { exec, spawn } from "child_process";
import consola from "consola";
import fs from "fs/promises";
import path from "path";
import { promisify } from "util";

const execPromise = promisify(exec);
const CWD = process.cwd();

// Utility function to check if bun is installed
async function isBunInstalled(): Promise<boolean> {
  try {
    await execPromise("bun --version");
    return true;
  } catch {
    return false;
  }
}

// Utility function to get the project's entrypoint file (index.ts or index.js)
async function getEntryPoint(customFile?: string): Promise<string> {
  if (customFile) {
    const customPath = path.resolve(CWD, customFile);
    try {
      await fs.access(customPath, fs.constants.F_OK);
      return customPath;
    } catch (err) {
      consola.error(`Could not find custom entrypoint at ${customPath}`);
      throw err;
    }
  }
  const tsPath = path.join(CWD, "index.ts");
  const jsPath = path.join(CWD, "index.js");
  try {
    await fs.access(tsPath, fs.constants.F_OK);
    return tsPath;
  } catch {
    try {
      await fs.access(jsPath, fs.constants.F_OK);
      return jsPath;
    } catch {
      consola.error(
        "Could not find index.ts or index.js file in current directory.",
      );
      throw new Error("index.ts or index.js not found");
    }
  }
}

// Utility function to run a subprocess and return a promise
async function runSubprocess(
  command: string,
  args: string[] = [],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: any = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(command, args, {
      stdio: "inherit",
      ...options,
    });

    childProcess.on("error", (error) => {
      consola.error(`Error during subprocess: ${error.message}`);
      reject(error);
    });

    childProcess.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        consola.error(`Subprocess exited with code ${code}`);
        reject(new Error(`Subprocess exited with code ${code}`));
      }
    });
  });
}

// Utility function to determine if project is JS or TS based on tsconfig
async function isTypeScriptProject(): Promise<boolean> {
  try {
    await fs.access(path.join(CWD, "tsconfig.json"), fs.constants.F_OK);
    return true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return false;
  }
}

export {
  CWD,
  getEntryPoint,
  isBunInstalled,
  isTypeScriptProject,
  runSubprocess,
};
