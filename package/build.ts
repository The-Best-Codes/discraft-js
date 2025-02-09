import { build } from "bun";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, "src");
const outDir = path.join(__dirname, "dist");
// const indexFile = path.join(sourceDir, "index.ts");
const cliFile = path.join(sourceDir, "cli.ts");

await fs.rm(outDir, { recursive: true, force: true });

await build({
  entrypoints: [cliFile],
  //minify: true,
  splitting: true,
  packages: "external",
  outdir: outDir,
  target: "node",
  sourcemap: "external",
});
