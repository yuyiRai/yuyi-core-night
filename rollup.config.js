import typescript from 'rollup-plugin-typescript2'
import commonjs from 'rollup-plugin-commonjs'
import json from 'rollup-plugin-json';
import external from 'rollup-plugin-peer-deps-external'
// import postcss from 'rollup-plugin-postcss-modules'
import postcss from 'rollup-plugin-postcss'
import resolve from 'rollup-plugin-node-resolve'
import url from 'rollup-plugin-url'
import svgr from '@svgr/rollup'

import pkg from './package.json'

export default {
  input: 'src/index.tsx',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      exports: 'named',
      sourcemap: true,
    },
    {
      file: pkg.module,
      format: 'es',
      exports: 'named',
      sourcemap: true
    }
  ],
  onwarn(warning, warn) {
    if (warning.code !== 'CIRCULAR_DEPENDENCY') {
      // this sends the warning back to Rollup's internal warning handler
      warn(warning);
    }
  },
  plugins: [
    external({}),
    json(),
    postcss({
      modules: true
    }),
    url(),
    svgr(),
    resolve({
      preferBuiltins: true
    }),
    typescript({
      rollupCommonJSResolveHack: true,
      clean: true,
      tsconfig: 'tsconfig.json',
      check: false,
      typescript: require('ttypescript')
    }),
    commonjs({
      namedExports: {
        'node_modules\\react-is\\index.js': ['ReactIs', 'isElement', 'isValidElementType', 'ForwardRef'],
        'node_modules\\fbjs\\lib\\ExecutionEnvironment.js': ['canUseDOM'],
        'node_modules\\ts-transformer-keys\\index.js': ['keys']
      }
    })
  ]
}
