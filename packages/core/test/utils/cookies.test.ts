import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getCookie, setCookie, removeCookie } from '../../src/utils/cookies';

/**
 * JSDOM supports document.cookie get/set natively — it maintains a cookie jar.
 * We test behavior (read/write/delete) rather than spying on the setter,
 * because JSDOM's cookie property descriptor doesn't allow vi.spyOn.
 *
 * For format verification (max-age, SameSite, etc.) we extract and test
 * the internal buildCookieString helper separately where needed.
 */

// Helper: clear all cookies between tests via JSDOM-native expiry
function clearAllCookies() {
  document.cookie.split(';').forEach((c) => {
    const name = c.trim().split('=')[0];
    if (name) {
      document.cookie = `${name}=; max-age=0; path=/`;
    }
  });
}

describe('cookies', () => {
  beforeEach(() => {
    clearAllCookies();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCookie', () => {
    it('returns undefined when cookie does not exist', () => {
      expect(getCookie('nope')).toBeUndefined();
    });

    it('returns the correct value when cookie exists', () => {
      document.cookie = 'sw-color-mode=dark';
      expect(getCookie('sw-color-mode')).toBe('dark');
    });

    it('returns correct value when multiple cookies exist', () => {
      document.cookie = 'foo=bar';
      document.cookie = 'sw-color-mode=light';
      document.cookie = 'baz=qux';
      expect(getCookie('sw-color-mode')).toBe('light');
    });

    it('decodes URI-encoded values', () => {
      document.cookie = `data=${encodeURIComponent('{"a":1}')}`;
      expect(getCookie('data')).toBe('{"a":1}');
    });

    it('returns undefined during SSR (no document)', () => {
      const original = globalThis.document;
      Object.defineProperty(globalThis, 'document', { value: undefined, configurable: true });
      try {
        expect(getCookie('any')).toBeUndefined();
      } finally {
        Object.defineProperty(globalThis, 'document', { value: original, configurable: true });
      }
    });

    it('does not match partial cookie names', () => {
      document.cookie = 'sw-color-mode-extra=wrong';
      expect(getCookie('sw-color-mode')).toBeUndefined();
    });
  });

  describe('setCookie', () => {
    it('writes a cookie that is readable via getCookie', () => {
      setCookie('sw-test', 'hello');
      expect(getCookie('sw-test')).toBe('hello');
    });

    it('overwrites an existing cookie', () => {
      setCookie('sw-test', 'first');
      setCookie('sw-test', 'second');
      expect(getCookie('sw-test')).toBe('second');
    });

    it('handles special characters via URI encoding', () => {
      setCookie('data', '{"key":"value"}');
      expect(getCookie('data')).toBe('{"key":"value"}');
    });
  });

  describe('removeCookie', () => {
    it('removes an existing cookie', () => {
      setCookie('sw-test', 'hello');
      expect(getCookie('sw-test')).toBe('hello');
      removeCookie('sw-test');
      expect(getCookie('sw-test')).toBeUndefined();
    });

    it('is a no-op when cookie does not exist', () => {
      // Should not throw
      removeCookie('nonexistent');
      expect(getCookie('nonexistent')).toBeUndefined();
    });
  });
});
