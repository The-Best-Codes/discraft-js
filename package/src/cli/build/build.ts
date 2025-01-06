import { build as bunBuild } from "bun";

function build(env: "dev" | "prod", path: string, output: string) {
  bunBuild({
    entrypoints: [path],
    outdir: output,
    target: "node",
    minify: env === "prod",
    packages: "external",
    // @ts-ignore
    throw: true,
  });
}

export { build };
