import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  registerScaffoldHook,
  clearScaffoldHooks,
  getScaffoldHooks,
  getScaffoldHooksForType,
  runScaffoldHooks,
} from '../src/registry';

describe('Scaffold Hook Registry', () => {
  beforeEach(() => {
    clearScaffoldHooks();
  });

  describe('registerScaffoldHook', () => {
    it('registers a hook successfully', () => {
      const hook = {
        type: 'preScaffold' as const,
        name: 'test-hook',
        handler: vi.fn(),
      };
      registerScaffoldHook(hook);
      const hooks = getScaffoldHooks();
      expect(hooks).toHaveLength(1);
      expect(hooks[0].name).toBe('test-hook');
    });

    it('sorts hooks by priority', () => {
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
      const hooks = getScaffoldHooksForType('preScaffold');
      expect(hooks[0].name).toBe('high-priority');
      expect(hooks[1].name).toBe('low-priority');
    });
  });

  describe('runScaffoldHooks', () => {
    it('executes hooks in order', async () => {
      const order: string[] = [];
      registerScaffoldHook({
        type: 'preScaffold',
        name: 'first',
        handler: async () => {
          order.push('first');
        },
      });
      registerScaffoldHook({
        type: 'preScaffold',
        name: 'second',
        handler: async () => {
          order.push('second');
        },
      });

      await runScaffoldHooks('preScaffold', {});
      expect(order).toEqual(['first', 'second']);
    });

    it('continues after non-critical hook failure', async () => {
      const order: string[] = [];
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

      await runScaffoldHooks('preScaffold', {});
      expect(order).toEqual(['failing', 'after']);
    });

    it('stops on critical hook failure', async () => {
      const order: string[] = [];
      registerScaffoldHook({
        type: 'preScaffold',
        name: 'failing',
        critical: true,
        handler: async () => {
          order.push('failing');
          throw new Error('Critical failure');
        },
      });
      registerScaffoldHook({
        type: 'preScaffold',
        name: 'should-not-run',
        handler: async () => {
          order.push('should-not-run');
        },
      });

      await expect(runScaffoldHooks('preScaffold', {})).rejects.toThrow('Critical failure');
      expect(order).toEqual(['failing']);
    });
  });
});
