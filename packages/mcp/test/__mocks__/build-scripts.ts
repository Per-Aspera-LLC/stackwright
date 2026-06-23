/**
 * Stub for @stackwright/build-scripts used in vitest.
 *
 * The real package only publishes a CJS `require` condition in its exports
 * map. Vite 7+ will not fall back to `main` when an `exports` map is present
 * and no matching condition is found, causing a hard module-resolution failure
 * during Vite's static import-analysis phase — before any vi.mock() hoisting
 * can intercept it.
 *
 * This stub is aliased in via vitest.config.ts so Vite resolves a real file
 * with a proper ESM `import` path instead.
 *
 * Kept minimal — only exports the symbol that render.ts actually uses.
 */
export const runPrebuild = async (): Promise<void> => {
  /* no-op stub */
};
