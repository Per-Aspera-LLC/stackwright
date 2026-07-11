import path from 'path';
import type { PrebuildOptions, PrebuildPlugin, PrebuildPluginContext } from '@stackwright/types';
import { discoverPlugins } from './discover';

/**
 * Internal context threaded through all compile primitives.
 *
 * Created once per `runPrebuild` / `compileAll` invocation and passed
 * to every compile function. Keeps the function signatures clean and
 * avoids re-deriving the same paths in every primitive.
 */
export interface CompileContext {
  /** Absolute path to the project root (where stackwright.yml lives). */
  projectRoot: string;
  /** Absolute path to `public/stackwright-content/`. */
  contentOutDir: string;
  /** Absolute path to `public/images/`. */
  imagesDir: string;
  /** Absolute path to `public/`. */
  publicDir: string;
  /** Absolute path to `src/generated/` (for generated TypeScript). */
  generatedDir: string;
  /** Registered prebuild plugins. */
  plugins: PrebuildPlugin[];
  /** How to handle unknown content type errors during page validation. */
  unknownContentTypes: 'error' | 'warn' | 'ignore';
  /** Whether image optimization is enabled (resolved from CLI flag + site config). */
  imageOptimizationEnabled: boolean;
}

/**
 * Build a CompileContext from PrebuildOptions.
 * Resolves all path derivations in one place.
 */
export function createCompileContext(options?: string | PrebuildOptions): CompileContext {
  const projectRoot =
    typeof options === 'string' ? options : (options?.projectRoot ?? process.cwd());
  const plugins = typeof options === 'object' && options !== null ? (options.plugins ?? []) : [];
  const unknownContentTypes =
    typeof options === 'object' && options !== null
      ? (options.unknownContentTypes ?? 'error')
      : 'error';
  const imageOptimizationEnabled =
    typeof options === 'object' && options !== null && options.imageOptimization !== undefined
      ? options.imageOptimization
      : true;

  const publicDir = path.join(projectRoot, 'public');

  return {
    projectRoot,
    contentOutDir: path.join(publicDir, 'stackwright-content'),
    imagesDir: path.join(publicDir, 'images'),
    publicDir,
    generatedDir: path.join(projectRoot, 'src', 'generated'),
    plugins,
    unknownContentTypes,
    imageOptimizationEnabled,
  };
}

/**
 * Discover plugins and attach them to an existing CompileContext in-place.
 *
 * Called by runPrebuild() immediately after createCompileContext() and before
 * compileAll(). Skipped entirely when options.plugins is explicitly set
 * (including an explicit empty array — [] means "I want no plugins").
 *
 * Intentionally synchronous — discoverPlugins() uses CJS require() to avoid
 * introducing an async yield before the synchronous file-write phase of
 * compileAll(). runWatch() calls runPrebuild() without await, relying on
 * the invariant that all sync writes precede the first await in runPrebuild.
 */
export function discoverAndAttachPlugins(
  ctx: CompileContext,
  options?: string | PrebuildOptions
): void {
  // Explicit plugins array (including []) → caller owns the list, skip discovery.
  if (typeof options === 'object' && options !== null && 'plugins' in options) {
    return;
  }

  const opts = typeof options === 'object' && options !== null ? options : {};

  const discovered = discoverPlugins(ctx.projectRoot, {
    enabled: opts.pluginDiscovery,
    overrideList: opts.pluginOverride,
  });

  // Mutate in place — ctx is the single instance threaded through compileAll.
  ctx.plugins = discovered;
}

/**
 * Convert a CompileContext into the public PrebuildPluginContext shape
 * that plugin hooks receive. Keeps siteConfig as a lazy-populated field
 * (plugins that need it read it themselves via beforeBuild/afterBuild).
 *
 * NOTE: `siteConfig` is intentionally left as an empty object here — the
 * plugin context passed to beforeBuild/afterBuild is constructed after
 * compileSite() runs, so callers that need the real siteConfig should
 * pass it explicitly. This function exists for structural compatibility.
 */
export function toPluginContext(
  ctx: CompileContext,
  siteConfig: Record<string, unknown> = {}
): PrebuildPluginContext {
  return {
    projectRoot: ctx.projectRoot,
    siteConfig,
    contentOutDir: ctx.contentOutDir,
    imagesDir: ctx.imagesDir,
    generatedDir: ctx.generatedDir,
  };
}
