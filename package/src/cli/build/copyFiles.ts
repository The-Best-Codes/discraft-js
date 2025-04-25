import consola from "consola";
import fs from "fs/promises";
import path from "path";

async function copyFiles(rootDir: string, outputDir: string): Promise<void> {
  const filesToCopy = ["package.json", ".gitignore", ".env"];

  for (const file of filesToCopy) {
    const sourcePath = path.join(rootDir, file);
    const destPath = path.join(outputDir, file);

    try {
      await fs.access(sourcePath); // Check if the file exists
      await fs.mkdir(path.dirname(destPath), { recursive: true }); // Ensure dest dir exists
      await fs.copyFile(sourcePath, destPath);
      consola.verbose(`Copied ${file} to ${destPath}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.code === "ENOENT") {
        consola.verbose(
          `Skipping ${file} as it does not exist in the root directory.`,
        );
      } else {
        console.error(`Error copying ${file} to ${destPath}:`, err);
      }
    }
  }
}

export default copyFiles;
