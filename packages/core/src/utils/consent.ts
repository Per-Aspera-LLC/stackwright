/**
 * Cookie consent state management for Stackwright.
 *
 * Provides a minimal API for tracking which cookie categories the user
 * has accepted. The consent cookie itself ('sw-consent') is "strictly
 * necessary" — it records the user's privacy preference.
 *
 * Categories follow IAB TCF standard naming.
 */

import { getCookie, setCookie } from './cookies';

export type ConsentCategory = 'necessary' | 'functional' | 'analytics' | 'marketing';

export type ConsentState = Record<ConsentCategory, boolean>;

const CONSENT_COOKIE = 'sw-consent';

const DEFAULT_STATE: ConsentState = {
  necessary: true, // always true — cannot be declined
  functional: false,
  analytics: false,
  marketing: false,
};

/** Read consent state from cookie. Returns null if user hasn't decided yet. */
export function getConsentState(): ConsentState | null {
  const raw = getCookie(CONSENT_COOKIE);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      necessary: true, // enforce: always true, even if someone tampers
    };
  } catch {
    return null;
  }
}

/** Write consent state to cookie. Forces `necessary` to true. */
export function setConsentState(state: Partial<ConsentState>): void {
  const resolved: ConsentState = {
    ...DEFAULT_STATE,
    ...state,
    necessary: true,
  };
  setCookie(CONSENT_COOKIE, JSON.stringify(resolved));
}

/** Check if a specific category is consented. Returns true for 'necessary'. */
export function hasConsent(category: ConsentCategory): boolean {
  if (category === 'necessary') return true;
  const state = getConsentState();
  return state ? state[category] : false;
}
