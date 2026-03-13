/**
 * Minimal, dependency-free cookie utility for Stackwright.
 *
 * Client-only — returns safe defaults during SSR.
 * SameSite=Lax by default (functional cookies don't need None).
 * No HttpOnly — these are client-readable preference cookies.
 */

export interface CookieOptions {
  /** Max age in seconds. Default: 365 days. */
  maxAge?: number;
  /** Cookie path. Default: '/'. */
  path?: string;
  /** SameSite policy. Default: 'Lax'. */
  sameSite?: 'Strict' | 'Lax' | 'None';
  /** Secure flag. Default: true if current protocol is HTTPS. */
  secure?: boolean;
}

const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

/** Read a cookie by name. Returns undefined if not found or during SSR. */
export function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;

  const match = document.cookie.match(new RegExp(`(?:^|; )${escapeRegExp(name)}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/** Set a cookie with sensible defaults for functional/preference cookies. */
export function setCookie(name: string, value: string, options?: CookieOptions): void {
  if (typeof document === 'undefined') return;

  const maxAge = options?.maxAge ?? ONE_YEAR_SECONDS;
  const path = options?.path ?? '/';
  const sameSite = options?.sameSite ?? 'Lax';
  const secure =
    options?.secure ?? (typeof location !== 'undefined' && location.protocol === 'https:');

  let cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAge}; path=${path}; SameSite=${sameSite}`;
  if (secure) cookie += '; Secure';

  document.cookie = cookie;
}

/** Remove a cookie by setting max-age=0. */
export function removeCookie(name: string, path = '/'): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; max-age=0; path=${path}`;
}

/** Escape special regex characters in cookie name. */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
