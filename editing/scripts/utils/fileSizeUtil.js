import fs from "fs";
import path from "path";
import { info, success } from "../../common/utils/logger.js";

export function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export async function getFileSizes(dir) {
  const files = await fs.promises.readdir(dir, { withFileTypes: true });
  let totalSize = 0;

  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      totalSize += await getFileSizes(fullPath);
    } else if (file.name.endsWith(".js")) {
      const stats = await fs.promises.stat(fullPath);
      totalSize += stats.size;
    }
  }
  return totalSize;
}

export async function displaySizeComparison(srcSize, distPath) {
  // Get bundle size
  const bundlePath = path.join(distPath, "bundle.js");
  const bundleSize = fs.existsSync(bundlePath)
    ? (await fs.promises.stat(bundlePath)).size
    : 0;

  const reduction =
    srcSize > 0 ? (((srcSize - bundleSize) / srcSize) * 100).toFixed(1) : 0;

  info("\nBuild Statistics:");
  info("================");
  info("Source Files:");
  info(`  Original Size: ${formatBytes(srcSize)}`);
  info("\nBundle:");
  info(`  Final Size: ${formatBytes(bundleSize)}`);
  info(`  Size Reduction: ${reduction}%\n`);

  success("\nTotal Results:");
  success(`Original Size: ${formatBytes(srcSize)}`);
  success(`Final Size  : ${formatBytes(bundleSize)}`);
  success(`Total Saved : ${reduction}%`);
}
