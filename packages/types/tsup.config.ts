import { defineConfig, type Options } from 'tsup'

const config: Options = {
  entry: ['src/types/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
}

export default defineConfig(config)
