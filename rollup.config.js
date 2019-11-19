import nodeResolve from 'rollup-plugin-node-resolve'
import commonJS from 'rollup-plugin-commonjs'
import json from 'rollup-plugin-json'
import typescript from 'rollup-plugin-typescript'

module.exports = {
  input: {
    main: 'src/main.ts'
  },
  manualChunks(id) {
    if (id.includes('node_modules')) {
      return 'vendor'
    }
  },
  output: [{
    dir: 'dist',
    format: 'cjs',
    chunkFileNames: '[name].js'
  }],
  plugins: [
    typescript(),
    nodeResolve({
      preferBuiltins: true
    }),
    commonJS({
      include: 'node_modules/**',
      sourceMap: false
    }),
    json()
  ],
  external: ['aws-sdk', 'archiver', 'stream', 'path', 'fs', 'util', 'child_process', 'tmp-promise', 'yaml-cfn']
}