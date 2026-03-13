import { describe, it, expect, beforeEach } from 'vitest';
import { getConsentState, setConsentState, hasConsent } from '../../src/utils/consent';

// Helper: clear all cookies between tests
function clearAllCookies() {
  document.cookie.split(';').forEach((c) => {
    const name = c.trim().split('=')[0];
    if (name) {
      document.cookie = `${name}=; max-age=0; path=/`;
    }
  });
}

describe('consent', () => {
  beforeEach(() => {
    clearAllCookies();
  });

  describe('getConsentState', () => {
    it('returns null when no consent cookie is set', () => {
      expect(getConsentState()).toBeNull();
    });

    it('returns parsed consent state from cookie', () => {
      const state = { necessary: true, functional: true, analytics: false, marketing: false };
      document.cookie = `sw-consent=${encodeURIComponent(JSON.stringify(state))}`;
      expect(getConsentState()).toEqual(state);
    });

    it('enforces necessary=true even if cookie says false', () => {
      const tampered = { necessary: false, functional: false, analytics: false, marketing: false };
      document.cookie = `sw-consent=${encodeURIComponent(JSON.stringify(tampered))}`;
      const result = getConsentState();
      expect(result?.necessary).toBe(true);
    });

    it('returns null for malformed cookie value', () => {
      document.cookie = 'sw-consent=not-json';
      expect(getConsentState()).toBeNull();
    });

    it('fills in missing fields with defaults', () => {
      document.cookie = `sw-consent=${encodeURIComponent(JSON.stringify({ analytics: true }))}`;
      const result = getConsentState();
      expect(result).toEqual({
        necessary: true,
        functional: false,
        analytics: true,
        marketing: false,
      });
    });
  });

  describe('setConsentState', () => {
    it('writes consent state readable via getConsentState', () => {
      setConsentState({ functional: true, analytics: true });
      const result = getConsentState();
      expect(result).toEqual({
        necessary: true,
        functional: true,
        analytics: true,
        marketing: false,
      });
    });

    it('forces necessary to true even if passed false', () => {
      setConsentState({ necessary: false } as any);
      const result = getConsentState();
      expect(result?.necessary).toBe(true);
    });

    it('overwrites previous consent state', () => {
      setConsentState({ analytics: true });
      setConsentState({ analytics: false, marketing: true });
      const result = getConsentState();
      expect(result?.analytics).toBe(false);
      expect(result?.marketing).toBe(true);
    });
  });

  describe('hasConsent', () => {
    it('always returns true for necessary', () => {
      expect(hasConsent('necessary')).toBe(true);
    });

    it('returns false for analytics before consent', () => {
      expect(hasConsent('analytics')).toBe(false);
    });

    it('returns true for analytics after accepting', () => {
      setConsentState({ analytics: true });
      expect(hasConsent('analytics')).toBe(true);
    });

    it('returns false for marketing when not consented', () => {
      setConsentState({ functional: true, analytics: true });
      expect(hasConsent('marketing')).toBe(false);
    });
  });
});
