/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { execSync } from "child_process";

function getEnvVar(key: string): string | undefined {
  // Create a completely isolated dynamic lookup.
  // This is necessary to avoid static replacement of process.env.SOME_VARIABLE
  if (Object.prototype.hasOwnProperty.call(process.env, key)) {
    return process.env[key];
  }
  return undefined;
}

async function detectPackageManager(): Promise<string | undefined> {
  const userAgent = getEnvVar("npm_config_user_agent");

  if (userAgent) {
    if (userAgent.startsWith("bun")) {
      return "bun";
    }
    if (userAgent.startsWith("npm")) {
      return "npm";
    }
    if (userAgent.startsWith("yarn")) {
      return "yarn";
    }
    if (userAgent.startsWith("pnpm")) {
      return "pnpm";
    }
  }

  try {
    execSync("bun --version", { stdio: "ignore" });
    return "bun";
  } catch (e) {}
  try {
    execSync("npm --version", { stdio: "ignore" });
    return "npm";
  } catch (e) {}
  try {
    execSync("yarn --version", { stdio: "ignore" });
    return "yarn";
  } catch (e) {}
  try {
    execSync("pnpm --version", { stdio: "ignore" });
    return "pnpm";
  } catch (e) {}

  return undefined;
}

export { detectPackageManager };
