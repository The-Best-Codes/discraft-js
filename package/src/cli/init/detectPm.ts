import { execSync } from "child_process";

async function detectPackageManager(): Promise<string | undefined> {
  // Access process.env dynamically to avoid static replacement during build
  const userAgent = Object.prototype.hasOwnProperty.call(
    process.env,
    "npm_config_user_agent",
  )
    ? process.env.npm_config_user_agent
    : undefined;

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
