import typescript from 'rollup-plugin-typescript2'
import ttypescript from 'ttypescript'
import commonjs from 'rollup-plugin-commonjs'
import json from 'rollup-plugin-json';
import external from 'rollup-plugin-peer-deps-external'
// import postcss from 'rollup-plugin-postcss-modules'
import postcss from 'rollup-plugin-postcss'
import resolve from 'rollup-plugin-node-resolve'
import url from 'rollup-plugin-url'
import svgr from '@svgr/rollup'
import path from 'path'
// import babel from 'rollup-plugin-babel';

const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'
console.log('welcome: ', process.env.NODE_ENV)

import pkg from './package.json'
let cache = {};
export default {
  external: ['react-is', 'react','react-dom', 'mobx', 'mobx-react', 'antd', '@ant-design', 'element-ui', 'element-react', 'element-theme-default'],
  input: {
    index: 'src/index.tsx'
  },
  treeshake: isProduction,
  cache: isDevelopment ? cache : false,
  inlineDynamicImports: false,
  manualChunks(path) {
    if(['node_modules'].some(m => path.includes(m))){
      return 'vendor'
    }
  },
  output: [
    {
      dir: path.dirname(pkg.main),
      format: 'es',
      chunkFileNames: '[name].js',
      entryFileNames: '[name].js',
	    sourcemap: true,
      exports: 'named'
    },
    // {
    //   dir: path.dirname(pkg.main),
    //   format: 'cjs',
    //   sourcemap: true,
    //   chunkFileNames: '[name].js',
    //   entryFileNames: '[name].js',
    //   exports: 'named'
    // },
    // {
    //   file: pkg.main,
    //   format: 'cjs',
    //   exports: 'named',
    //   sourcemap: true,
    // },
    // {
    //   file: pkg.module,
    //   format: 'es',
    //   exports: 'named',
    //   sourcemap: true
    // }
  ],
  onwarn(warning, warn) {
    if (warning.code !== 'CIRCULAR_DEPENDENCY') {
      // this sends the warning back to Rollup's internal warning handler
      warn(warning);
    }
  },
  plugins: [
    external('element-ui'),
    json(),
    postcss({
      modules: false,
      inject: true,
      extract: true,
      onImport: id => console.log('post css: ' +id)
    }),
    url({
      limit: 0,
      include:  ["**/*.svg", "**/*.png", "**/*.jpg", "**/*.gif", "**/*.ttf", "**/*.wof", "**/fonts/**"]
    }),
    svgr(),
    resolve({
      mainFields: ['module', 'main'],
      preferBuiltins: false,
      dedupe: ['react', 'react-dom']
    }),
    typescript({
      rollupCommonJSResolveHack: true,
      clean: true,
      tsconfig: 'tsconfig.json',
      tsconfigOverride: {
        target: 'es5'
      },
      check: false,
      exclude: ['**/*.test.*', '**/*.spec.*'],
      typescript: ttypescript
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
