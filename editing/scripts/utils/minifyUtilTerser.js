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
            keep_fnames: config.keepFunctionNames,
            pure_getters: true,
            dead_code: true,
            unused: true,
            properties: true,
            drop_debugger: true,
            arguments: true,
            booleans_as_integers: false,
            hoist_funs: true,
            hoist_props: true,
            hoist_vars: true,
            join_vars: true,
            negate_iife: true,
            reduce_vars: true,
            collapse_vars: true,
            inline: 3,
            evaluate: true,
            pure_funcs: ["console.log", "console.debug"],
            drop_console: false,
        },
        mangle: {
            module: true,
            toplevel: true,
            keep_fnames: config.keepFunctionNames,
            properties: config.maxOptimize ? {
                reserved: ["_events", "_eventsCount", "_maxListeners", "domain"],
                regex: /^_/
            } : false
        },
        format: {
            ecma: 2020,
            comments: !config.removeComments,
            ascii_only: true,
            beautify: false
        },
        sourceMap: config.sourceMaps,
        parse: {
            module: true,
            ecma: 2020
        }
    };

    const result = await minify(code, terserOptions);
    await fs.promises.writeFile(filePath, result.code);
    if (result.map && config.sourceMaps) {
        await fs.promises.writeFile(`${filePath}.map`, result.map);
    }
}