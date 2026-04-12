import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  registerScaffoldHook,
  clearScaffoldHooks,
  getScaffoldHooks,
  getScaffoldHooksForType,
  runScaffoldHooks,
  resetForTesting,
} from '../src/registry';
import type { ScaffoldHookType, ScaffoldHookContext } from '../src/hooks';

describe('Scaffold Hook Registry', () => {
  beforeEach(() => {
    resetForTesting();
  });

  afterEach(() => {
    resetForTesting();
  });

  describe('registerScaffoldHook', () => {
    it('registers a hook successfully', () => {
      const hook = {
        type: 'preScaffold' as ScaffoldHookType,
        name: 'test-hook',
        handler: vi.fn(),
      };
      registerScaffoldHook(hook);
      const hooks = getScaffoldHooks();
      expect(hooks).toHaveLength(1);
      expect(hooks[0].name).toBe('test-hook');
    });

    it('registers multiple hooks', () => {
      registerScaffoldHook({
        type: 'preInstall',
        name: 'hook-1',
        handler: vi.fn(),
      });
      registerScaffoldHook({
        type: 'postInstall',
        name: 'hook-2',
        handler: vi.fn(),
      });
      expect(getScaffoldHooks()).toHaveLength(2);
    });

    it('replaces hook with same name', () => {
      registerScaffoldHook({
        type: 'preScaffold',
        name: 'same-name',
        priority: 10,
        handler: vi.fn(),
      });
      registerScaffoldHook({
        type: 'preScaffold',
        name: 'same-name',
        priority: 20,
        handler: vi.fn(),
      });
      const hooks = getScaffoldHooks();
      expect(hooks).toHaveLength(1);
      expect(hooks[0].priority).toBe(20);
    });

    it('applies default priority', () => {
      registerScaffoldHook({
        type: 'preScaffold',
        name: 'no-priority',
        handler: vi.fn(),
      });
      const hooks = getScaffoldHooks();
      expect(hooks[0].priority).toBe(50);
    });

    it('applies default critical flag', () => {
      registerScaffoldHook({
        type: 'preScaffold',
        name: 'no-critical',
        handler: vi.fn(),
      });
      const hooks = getScaffoldHooks();
      expect(hooks[0].critical).toBe(false);
    });
  });

  describe('getScaffoldHooks', () => {
    it('returns hooks sorted by priority (ascending)', () => {
      registerScaffoldHook({
        type: 'preScaffold',
        name: 'low-priority',
        priority: 100,
        handler: vi.fn(),
      });
      registerScaffoldHook({
        type: 'preScaffold',
        name: 'high-priority',
        priority: 10,
        handler: vi.fn(),
      });
      registerScaffoldHook({
        type: 'preScaffold',
        name: 'medium-priority',
        priority: 50,
        handler: vi.fn(),
      });

      const hooks = getScaffoldHooks();
      expect(hooks[0].name).toBe('high-priority');
      expect(hooks[1].name).toBe('medium-priority');
      expect(hooks[2].name).toBe('low-priority');
    });

    it('returns empty array when no hooks registered', () => {
      const hooks = getScaffoldHooks();
      expect(hooks).toHaveLength(0);
    });

    it('returns a new array each call (no mutation risk)', () => {
      const hooks1 = getScaffoldHooks();
      const hooks2 = getScaffoldHooks();
      expect(hooks1).not.toBe(hooks2);
    });
  });

  describe('getScaffoldHooksForType', () => {
    it('filters hooks by type', () => {
      registerScaffoldHook({
        type: 'preScaffold',
        name: 'pre-scaffold-hook',
        handler: vi.fn(),
      });
      registerScaffoldHook({
        type: 'preInstall',
        name: 'pre-install-hook',
        handler: vi.fn(),
      });
      registerScaffoldHook({
        type: 'postInstall',
        name: 'post-install-hook',
        handler: vi.fn(),
      });

      const preScaffold = getScaffoldHooksForType('preScaffold');
      expect(preScaffold).toHaveLength(1);
      expect(preScaffold[0].name).toBe('pre-scaffold-hook');

      const preInstall = getScaffoldHooksForType('preInstall');
      expect(preInstall).toHaveLength(1);
      expect(preInstall[0].name).toBe('pre-install-hook');
    });

    it('returns empty array when no hooks match type', () => {
      registerScaffoldHook({
        type: 'preScaffold',
        name: 'pre-scaffold-hook',
        handler: vi.fn(),
      });

      const postInstall = getScaffoldHooksForType('postInstall');
      expect(postInstall).toHaveLength(0);
    });

    it('returns hooks sorted by priority', () => {
      registerScaffoldHook({
        type: 'preInstall',
        name: 'low',
        priority: 100,
        handler: vi.fn(),
      });
      registerScaffoldHook({
        type: 'preInstall',
        name: 'high',
        priority: 10,
        handler: vi.fn(),
      });

      const hooks = getScaffoldHooksForType('preInstall');
      expect(hooks[0].name).toBe('high');
      expect(hooks[1].name).toBe('low');
    });
  });

  describe('clearScaffoldHooks', () => {
    it('removes all registered hooks', () => {
      registerScaffoldHook({
        type: 'preScaffold',
        name: 'hook-1',
        handler: vi.fn(),
      });
      registerScaffoldHook({
        type: 'preInstall',
        name: 'hook-2',
        handler: vi.fn(),
      });

      clearScaffoldHooks();
      expect(getScaffoldHooks()).toHaveLength(0);
    });
  });

  describe('resetForTesting', () => {
    it('clears all hooks', () => {
      registerScaffoldHook({
        type: 'preScaffold',
        name: 'test-hook',
        handler: vi.fn(),
      });

      resetForTesting();
      expect(getScaffoldHooks()).toHaveLength(0);
    });
  });

  describe('runScaffoldHooks', () => {
    it('executes hooks in priority order', async () => {
      const order: string[] = [];
      const context = {} as ScaffoldHookContext;

      registerScaffoldHook({
        type: 'preScaffold',
        name: 'first',
        priority: 50,
        handler: async () => {
          order.push('first');
        },
      });
      registerScaffoldHook({
        type: 'preScaffold',
        name: 'second',
        priority: 100,
        handler: async () => {
          order.push('second');
        },
      });
      registerScaffoldHook({
        type: 'preScaffold',
        name: 'third',
        priority: 25,
        handler: async () => {
          order.push('third');
        },
      });

      await runScaffoldHooks('preScaffold', context);
      expect(order).toEqual(['third', 'first', 'second']);
    });

    it('passes context to hook handlers', async () => {
      let receivedContext: ScaffoldHookContext | undefined;
      const context: ScaffoldHookContext = {
        targetDir: '/test/path',
        projectName: 'test-project',
        siteTitle: 'Test Site',
        themeId: 'default',
        packageJson: {},
        dependencyMode: 'workspace',
      };

      registerScaffoldHook({
        type: 'preScaffold',
        name: 'context-checker',
        handler: async (ctx) => {
          receivedContext = ctx;
        },
      });

      await runScaffoldHooks('preScaffold', context);
      expect(receivedContext?.targetDir).toBe('/test/path');
      expect(receivedContext?.projectName).toBe('test-project');
    });

    it('continues after non-critical hook failure', async () => {
      const order: string[] = [];
      const context = {} as ScaffoldHookContext;

      registerScaffoldHook({
        type: 'preScaffold',
        name: 'failing',
        critical: false,
        handler: async () => {
          order.push('failing');
          throw new Error('Non-critical failure');
        },
      });
      registerScaffoldHook({
        type: 'preScaffold',
        name: 'after',
        handler: async () => {
          order.push('after');
        },
      });

      await runScaffoldHooks('preScaffold', context);
      expect(order).toEqual(['failing', 'after']);
    });

    it('throws on critical hook failure', async () => {
      const context = {} as ScaffoldHookContext;

      registerScaffoldHook({
        type: 'preScaffold',
        name: 'critical-failing',
        critical: true,
        handler: async () => {
          throw new Error('Critical failure');
        },
      });
      registerScaffoldHook({
        type: 'preScaffold',
        name: 'should-not-run',
        handler: async () => {},
      });

      await expect(runScaffoldHooks('preScaffold', context)).rejects.toThrow(
        'Critical scaffold hook "critical-failing" failed: Critical failure'
      );
    });

    it('stops execution on critical hook failure', async () => {
      const order: string[] = [];
      const context = {} as ScaffoldHookContext;

      registerScaffoldHook({
        type: 'preScaffold',
        name: 'run-first',
        priority: 10,
        handler: async () => {
          order.push('run-first');
        },
      });
      registerScaffoldHook({
        type: 'preScaffold',
        name: 'critical',
        priority: 20,
        critical: true,
        handler: async () => {
          order.push('critical');
          throw new Error('Critical failure');
        },
      });
      registerScaffoldHook({
        type: 'preScaffold',
        name: 'should-not-run',
        priority: 30,
        handler: async () => {
          order.push('should-not-run');
        },
      });

      await expect(runScaffoldHooks('preScaffold', context)).rejects.toThrow();
      expect(order).toEqual(['run-first', 'critical']);
    });

    it('ignores hooks of other types', async () => {
      const order: string[] = [];
      const context = {} as ScaffoldHookContext;

      registerScaffoldHook({
        type: 'preInstall',
        name: 'pre-install-hook',
        handler: async () => {
          order.push('pre-install');
        },
      });
      registerScaffoldHook({
        type: 'postInstall',
        name: 'post-install-hook',
        handler: async () => {
          order.push('post-install');
        },
      });
      registerScaffoldHook({
        type: 'postScaffold',
        name: 'post-scaffold-hook',
        handler: async () => {
          order.push('post-scaffold');
        },
      });

      await runScaffoldHooks('preScaffold', context);
      expect(order).toHaveLength(0);
    });
  });

  describe('singleton behavior', () => {
    // The actual Symbol used by the registry
    const REGISTRY_KEY = Symbol.for('@stackwright/hooks-registry:hooks');
    type HookEntry = {
      type: string;
      name: string;
      priority: number;
      critical: boolean;
      handler: Function;
    };

    it('hooks persist in globalThis via Symbol.for', () => {
      // Register a hook
      registerScaffoldHook({
        type: 'preScaffold',
        name: 'global-test-hook',
        priority: 25,
        handler: vi.fn(),
      });

      // Access the actual global registry
      const global = globalThis as typeof globalThis & {
        [REGISTRY_KEY]?: Map<string, HookEntry>;
      };

      expect(global[REGISTRY_KEY]).toBeDefined();
      expect(global[REGISTRY_KEY]!.has('global-test-hook')).toBe(true);
      expect(global[REGISTRY_KEY]!.get('global-test-hook')!.priority).toBe(25);
    });

    it('resetForTesting clears global registry', () => {
      // Register a hook
      registerScaffoldHook({
        type: 'preInstall',
        name: 'should-be-cleared',
        handler: vi.fn(),
      });

      // Verify it's in the global registry
      const global = globalThis as typeof globalThis & {
        [REGISTRY_KEY]?: Map<string, HookEntry>;
      };
      expect(global[REGISTRY_KEY]!.size).toBeGreaterThan(0);

      // Reset
      resetForTesting();

      // Verify global registry is cleared
      expect(global[REGISTRY_KEY]!.size).toBe(0);
    });

    it('hooks survive simulated module boundary', () => {
      // This simulates two "different" modules accessing the same registry
      // Module A registers a hook
      registerScaffoldHook({
        type: 'postScaffold',
        name: 'module-a-hook',
        handler: vi.fn(),
      });

      // Module B would see the same registry
      // Verify by checking global directly
      const global = globalThis as typeof globalThis & {
        [REGISTRY_KEY]?: Map<string, HookEntry>;
      };

      // The hook registered above should be visible
      const hooks = Array.from(global[REGISTRY_KEY]!.values());
      expect(hooks.some((h) => h.name === 'module-a-hook')).toBe(true);
    });
  });
});
