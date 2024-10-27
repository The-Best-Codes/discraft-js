import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';
import babel from '@rollup/plugin-babel';

const config = {
  input: 'src/index.js',
  output: {
    file: 'dist/bundle.js',
    format: 'es',
    minifyInternalExports: true,
  },
  external: (id) => {
    return (
      !id.startsWith('.') &&
      !id.startsWith('/') &&
      !id.startsWith('src/') &&
      !id.startsWith('../') &&
      !id.startsWith('./') &&
      !id.startsWith('@/')
    )
  },
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
      ignoreDynamicRequires: false
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
    }),
  ],
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false
  }
};

export default config;
