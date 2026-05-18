import { beforeAll } from 'vitest';
import { stackwrightRegistry } from '../src/utils/stackwrightComponentRegistry';
import { DefaultStackwrightImage } from '../src/components/stackwright/DefaultStackwrightComponents';
import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement ResizeObserver — stub it for PageLayout's
// top-bar height measurement. Use a class (not an arrow function) so
// `new ResizeObserver(...)` doesn't throw "not a constructor".
global.ResizeObserver = class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

// jsdom doesn't implement matchMedia — stub it for ThemeProvider's
// prefers-color-scheme detection.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

beforeAll(() => {
  // Register test components using existing defaults
  stackwrightRegistry.register({
    Image: DefaultStackwrightImage,
  });
});
