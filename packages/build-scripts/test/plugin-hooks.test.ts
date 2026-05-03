import { describe, it, expect, vi, afterEach } from 'vitest';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { runPrebuild } from '../src/prebuild';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a minimal but fully-valid project root with stackwright.yml.
 * Must satisfy siteConfigSchema (title + navigation + appBar are required).
 */
function makeTempProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-plugin-test-'));
  fs.writeFileSync(
    path.join(dir, 'stackwright.yml'),
    `title: Test Site\nnavigation: []\nappBar:\n  titleText: Test Site\n`
  );
  fs.mkdirSync(path.join(dir, 'pages'), { recursive: true });
  return dir;
}

// ---------------------------------------------------------------------------
// Plugin hook execution — regression suite
// ---------------------------------------------------------------------------

describe('plugin hook execution', () => {
  it('preserves this binding for class-based plugins (regression: executePluginHook this-binding)', async () => {
    /**
     * This is the exact scenario that was broken:
     *
     * executePluginHook did:
     *   const hookFn = plugin[hook];
     *   await Promise.resolve(hookFn(context));   // ← this === undefined in strict mode
     *
     * Any class-based plugin that calls a private/instance method from a
     * lifecycle hook would throw "Cannot read properties of undefined".
     *
     * Fix: hookFn.call(plugin, context) preserves the plugin as receiver.
     */
    const projectRoot = makeTempProject();
    const calls: string[] = [];

    class TrackingPlugin {
      name = 'test-tracking-plugin';

      async beforeBuild(context: { projectRoot: string; siteConfig: Record<string, unknown> }) {
        // This call to a private method is exactly what was broken before the fix.
        // hookFn(context) stripped `this`, making this.recordCall undefined.
        this.recordCall('beforeBuild', context.projectRoot);
      }

      async afterBuild(context: { projectRoot: string; siteConfig: Record<string, unknown> }) {
        this.recordCall('afterBuild', context.projectRoot);
      }

      private recordCall(hook: string, root: string) {
        calls.push(`${hook}:${root}`);
      }
    }

    await runPrebuild({ projectRoot, plugins: [new TrackingPlugin()] });

    expect(calls).toContain(`beforeBuild:${projectRoot}`);
    expect(calls).toContain(`afterBuild:${projectRoot}`);
  });

  it('passes siteConfig and projectRoot in context to plugin hooks', async () => {
    const projectRoot = makeTempProject();
    let capturedContext: unknown = null;

    const plugin = {
      name: 'context-capture-plugin',
      async beforeBuild(ctx: unknown) {
        capturedContext = ctx;
      },
    };

    await runPrebuild({ projectRoot, plugins: [plugin] });

    expect(capturedContext).toMatchObject({
      projectRoot,
      siteConfig: expect.objectContaining({ title: 'Test Site' }),
    });
  });

  it('wraps plugin errors with plugin name and hook in message', async () => {
    const projectRoot = makeTempProject();

    const plugin = {
      name: 'failing-plugin',
      async beforeBuild() {
        throw new Error('something went wrong internally');
      },
    };

    await expect(runPrebuild({ projectRoot, plugins: [plugin] })).rejects.toThrow(
      'Plugin "failing-plugin" failed during beforeBuild: something went wrong internally'
    );
  });
});

// ---------------------------------------------------------------------------
// Helpers for content-type tests
// ---------------------------------------------------------------------------

function writePageContent(projectRoot: string, slug: string | null, yaml: string): void {
  const dir = slug ? path.join(projectRoot, 'pages', slug) : path.join(projectRoot, 'pages');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'content.yml'), yaml);
}

// ---------------------------------------------------------------------------
// Content type warnings and unknownContentTypes option
// ---------------------------------------------------------------------------

describe('content type warnings and unknownContentTypes option', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Gap 1: plugin-declared types trigger a warning', async () => {
    const projectRoot = makeTempProject();
    const plugin = {
      name: 'pro-content',
      knownContentTypeKeys: ['custom_widget'] as const,
      contentItemSchemas: [z.object({ type: z.literal('custom_widget') }).passthrough()],
    };
    writePageContent(
      projectRoot,
      null,
      `content:
  content_items:
    - type: custom_widget
      label: test-widget
`
    );

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await runPrebuild({ projectRoot, plugins: [plugin] });

    const warnCalls = warnSpy.mock.calls.map((args) => String(args[0]));
    expect(warnCalls.some((msg) => msg.includes('custom_widget'))).toBe(true);
    expect(warnCalls.some((msg) => msg.includes('registerContentType'))).toBe(true);
  });

  it('Gap 1: core types do NOT trigger the plugin warning', async () => {
    const projectRoot = makeTempProject();
    const plugin = {
      name: 'pro-content',
      knownContentTypeKeys: ['custom_widget'] as const,
      contentItemSchemas: [z.object({ type: z.literal('custom_widget') }).passthrough()],
    };
    writePageContent(
      projectRoot,
      null,
      `content:
  content_items:
    - type: text_block
      label: test-block
      textBlocks: []
`
    );

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await runPrebuild({ projectRoot, plugins: [plugin] });

    const warnCalls = warnSpy.mock.calls.map((args) => String(args[0]));
    expect(warnCalls.some((msg) => msg.includes('registerContentType'))).toBe(false);
  });

  it('Gap 2: unknownContentTypes "warn" logs but does not throw', async () => {
    const projectRoot = makeTempProject();
    writePageContent(
      projectRoot,
      null,
      `content:
  content_items:
    - type: totally_unknown_xyz
      label: bad-widget
`
    );

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(runPrebuild({ projectRoot, unknownContentTypes: 'warn' })).resolves.not.toThrow();

    const warnCalls = warnSpy.mock.calls.map((args) => String(args[0]));
    expect(warnCalls.some((msg) => msg.includes('totally_unknown_xyz'))).toBe(true);
  });

  it('Gap 2: unknownContentTypes "ignore" does not throw and does not warn', async () => {
    const projectRoot = makeTempProject();
    writePageContent(
      projectRoot,
      null,
      `content:
  content_items:
    - type: totally_unknown_xyz
      label: bad-widget
`
    );

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(
      runPrebuild({ projectRoot, unknownContentTypes: 'ignore' })
    ).resolves.not.toThrow();

    const warnCalls = warnSpy.mock.calls.map((args) => String(args[0]));
    expect(warnCalls.some((msg) => msg.includes('totally_unknown_xyz'))).toBe(false);
  });

  it('Gap 2: default behavior ("error") still throws', async () => {
    const projectRoot = makeTempProject();
    writePageContent(
      projectRoot,
      null,
      `content:
  content_items:
    - type: totally_unknown_xyz
      label: bad-widget
`
    );

    await expect(runPrebuild({ projectRoot })).rejects.toThrow('totally_unknown_xyz');
  });
});
