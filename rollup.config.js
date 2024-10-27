import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';
import babel from '@rollup/plugin-babel';

const config = {
  input: 'src/index.js',
  output: {
    dir: 'dist',
    format: 'es',
    preserveModules: true,
    preserveModulesRoot: 'src',
    minifyInternalExports: true,
    hoistTransitiveImports: true
  },
  external: [
    // Keep node built-ins external
    'fs',
    'path',
    'url',
    'util',
    'events',
    // Keep discord.js external as it's a runtime dependency
    'discord.js',
    // Keep dotenv external
    'dotenv',
  ],
  plugins: [
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    nodeResolve({
      preferBuiltins: true,
      exportConditions: ['node']
    }),
    commonjs({
      ignoreDynamicRequires: true
    }),
    json(),
    babel({
      babelHelpers: 'bundled',
      presets: [
        ['@babel/preset-env', {
          targets: { node: 'current' },
          modules: false,
          loose: true,
          exclude: ['transform-typeof-symbol']
        }]
      ]
    })
  ],
  treeshake: {
    moduleSideEffects: true,
    tryCatchDeoptimization: false
  }
};

export default config;
