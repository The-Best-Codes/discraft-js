/* eslint-disable camelcase */
import fs from "fs";
import { minify } from "terser";

export async function minifyWithTerser(filePath, config) {
  const code = await fs.promises.readFile(filePath, "utf8");

  const terserOptions = {
    module: true,
    toplevel: true,
    compress: {
      ecma: 2020,
      module: true,
      toplevel: true,
      passes: config.maxOptimize ? 3 : 1,
      keep_fnames: config.standalone ? true : config.keepFunctionNames,
      pure_getters: true,
      dead_code: true,
      unused: true,
      properties: !config.standalone,
      drop_debugger: !config.standalone,
      arguments: !config.standalone,
      booleans_as_integers: false,
      hoist_funs: !config.standalone,
      hoist_props: !config.standalone,
      hoist_vars: !config.standalone,
      join_vars: true,
      negate_iife: !config.standalone,
      reduce_vars: true,
      collapse_vars: !config.standalone,
      inline: config.standalone ? 1 : 3,
      evaluate: true,
      pure_funcs: ["console.log", "console.debug"],
      drop_console: false,
      sequences: true,
      unsafe_math: false,
      unsafe_methods: false,
      unsafe_proto: false,
      unsafe_regexp: false,
      unsafe_undefined: false,
    },
    mangle: config.standalone
      ? {
          module: true,
          toplevel: false,
          keep_fnames: true,
          properties: false,
        }
      : {
          module: true,
          toplevel: true,
          keep_fnames: config.keepFunctionNames,
          properties: config.maxOptimize
            ? {
                reserved: [
                  "_events",
                  "_eventsCount",
                  "_maxListeners",
                  "domain",
                ],
                regex: /^_/,
              }
            : false,
        },
    format: {
      ecma: 2020,
      comments: !config.removeComments,
      ascii_only: true,
      beautify: false,
      indent_level: 0,
      wrap_iife: false,
      preserve_annotations: true,
      max_line_len: false,
    },
    sourceMap: config.sourceMaps,
    ie8: false,
    safari10: false,
  };

  const result = await minify(code, terserOptions);
  if (result.error) {
    throw result.error;
  }

  await fs.promises.writeFile(filePath, result.code);
  if (result.map && config.sourceMaps) {
    await fs.promises.writeFile(filePath + ".map", result.map);
  }
}
