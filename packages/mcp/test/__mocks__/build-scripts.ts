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
export type LogSink = 'stdout' | 'stderr' | 'silent';

interface PrebuildOptionsStub {
  projectRoot?: string;
  logSink?: LogSink;
}

// Mirrors the *behavior* (not the internals) of the real
// @stackwright/build-scripts log sink (src/log.ts): writes one progress
// line via console.log for 'stdout' or console.error for 'stderr' -- the
// same console methods the real package's log() wraps -- so tests can
// prove render.ts actually threads a `logSink: 'stderr'` option through to
// runPrebuild(), which is the exact wiring swp-w00k depends on.
export const runPrebuild = async (options?: string | PrebuildOptionsStub): Promise<void> => {
  const sink: LogSink =
    typeof options === 'object' && options !== null ? (options.logSink ?? 'stdout') : 'stdout';
  if (sink === 'stderr') {
    console.error('Stackwright prebuild starting... (stub)');
  } else if (sink === 'stdout') {
    console.log('Stackwright prebuild starting... (stub)');
  }
};
