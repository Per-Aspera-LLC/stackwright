import { describe, it, expect, vi } from 'vitest';
import {
    getContrastRatio,
    isReadable,
    getBetterTextColor,
    getHoverColor,
    resolveColor,
} from '../../src/utils/colorUtils';

describe('getContrastRatio', () => {
    it('returns 21 for black on white', () => {
        expect(getContrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
    });

    it('is order-independent (white on black equals black on white)', () => {
        const a = getContrastRatio('#000000', '#ffffff');
        const b = getContrastRatio('#ffffff', '#000000');
        expect(a).toBeCloseTo(b, 5);
    });

    it('returns 1 for same color', () => {
        expect(getContrastRatio('#888888', '#888888')).toBeCloseTo(1, 5);
    });

    it('returns 1 when either color is invalid', () => {
        expect(getContrastRatio('notacolor', '#ffffff')).toBe(1);
        expect(getContrastRatio('#ffffff', 'notacolor')).toBe(1);
        expect(getContrastRatio('bad', 'also bad')).toBe(1);
    });

    it('returns a value between 1 and 21 for mid-range colors', () => {
        const ratio = getContrastRatio('#f59e0b', '#1f2937');
        expect(ratio).toBeGreaterThan(1);
        expect(ratio).toBeLessThanOrEqual(21);
    });

    it('works without leading # (bare hex)', () => {
        // hexToRgb regex accepts hex without #
        const withHash = getContrastRatio('#000000', '#ffffff');
        const withoutHash = getContrastRatio('000000', 'ffffff');
        expect(withHash).toBeCloseTo(withoutHash, 5);
    });
});

describe('isReadable', () => {
    it('returns true for black text on white background (ratio ~21)', () => {
        expect(isReadable('#000000', '#ffffff')).toBe(true);
    });

    it('returns true for white text on black background', () => {
        expect(isReadable('#ffffff', '#000000')).toBe(true);
    });

    it('returns false for same color (ratio 1)', () => {
        expect(isReadable('#888888', '#888888')).toBe(false);
    });

    it('returns false when contrast is below 4.5', () => {
        // Mid-grey on slightly different grey — low contrast
        expect(isReadable('#aaaaaa', '#bbbbbb')).toBe(false);
    });

    it('returns false for invalid hex', () => {
        expect(isReadable('notahex', '#ffffff')).toBe(false);
    });
});

describe('getBetterTextColor', () => {
    it('returns black when black has better contrast than white on a light background', () => {
        // Light yellow background — black is more readable
        const result = getBetterTextColor('#000000', '#ffffff', '#ffffcc');
        expect(result).toBe('#000000');
    });

    it('returns white when white has better contrast than black on a dark background', () => {
        // Dark background — white is more readable
        const result = getBetterTextColor('#000000', '#ffffff', '#1a1a2e');
        expect(result).toBe('#ffffff');
    });

    it('returns option1 when both options have equal contrast', () => {
        // Two identical options — ratio1 === ratio2, returns option1 (ratio1 > ratio2 is false)
        const result = getBetterTextColor('#ff0000', '#ff0000', '#ffffff');
        expect(result).toBe('#ff0000');
    });
});

describe('getHoverColor', () => {
    it('returns a valid hex string', () => {
        const result = getHoverColor('#f59e0b');
        expect(result).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('darkens a light color (luminance > 0.5)', () => {
        // White is the lightest color, should darken
        const result = getHoverColor('#ffffff', 0.15);
        // Each channel should be less than 255
        const r = parseInt(result.slice(1, 3), 16);
        const g = parseInt(result.slice(3, 5), 16);
        const b = parseInt(result.slice(5, 7), 16);
        expect(r).toBeLessThan(255);
        expect(g).toBeLessThan(255);
        expect(b).toBeLessThan(255);
    });

    it('lightens a dark color (luminance <= 0.5)', () => {
        // Black is the darkest color, should lighten
        const result = getHoverColor('#000000', 0.15);
        const r = parseInt(result.slice(1, 3), 16);
        const g = parseInt(result.slice(3, 5), 16);
        const b = parseInt(result.slice(5, 7), 16);
        expect(r).toBeGreaterThan(0);
        expect(g).toBeGreaterThan(0);
        expect(b).toBeGreaterThan(0);
    });

    it('returns original color string for invalid hex', () => {
        expect(getHoverColor('notahex')).toBe('notahex');
    });

    it('uses default factor of 0.15 when none provided', () => {
        const withDefault = getHoverColor('#888888');
        const withExplicit = getHoverColor('#888888', 0.15);
        expect(withDefault).toBe(withExplicit);
    });
});

describe('resolveColor', () => {
    const themeColors = {
        primary: '#f59e0b',
        secondary: '#334155',
        text: '#1f2937',
    };

    it('returns hex colors unchanged', () => {
        expect(resolveColor('#ff0000', themeColors)).toBe('#ff0000');
        expect(resolveColor('#000000', themeColors)).toBe('#000000');
    });

    it('resolves known theme color names to hex values', () => {
        expect(resolveColor('primary', themeColors)).toBe('#f59e0b');
        expect(resolveColor('secondary', themeColors)).toBe('#334155');
        expect(resolveColor('text', themeColors)).toBe('#1f2937');
    });

    it('returns the original string for unknown theme keys (passthrough)', () => {
        expect(resolveColor('unknownKey', themeColors)).toBe('unknownKey');
    });

    it('warns and returns transparent for non-string input', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        // Cast to bypass TypeScript so we can test the runtime guard
        expect(resolveColor(123 as unknown as string, themeColors)).toBe('transparent');
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
});
