import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentType } from 'react';
import {
    getComponentByType,
    registerComponent,
    componentRegistry,
} from '../../src/utils/componentRegistry';
import { stackwrightRegistry } from '../../src/utils/stackwrightComponentRegistry';

const StubComponent = (() => null) as unknown as ComponentType<any>;

beforeEach(() => {
    // Clear stackwright registry so stackwright-* lookups are in a known state
    stackwrightRegistry.clear();
});

describe('getComponentByType — built-in types', () => {
    it('resolves "main" to a non-null component', () => {
        expect(getComponentByType('main')).not.toBeNull();
    });

    it('resolves "carousel" to a non-null component', () => {
        expect(getComponentByType('carousel')).not.toBeNull();
    });

    it('resolves "timeline" to a non-null component', () => {
        expect(getComponentByType('timeline')).not.toBeNull();
    });

    it('resolves "tabbed_content" to a non-null component', () => {
        expect(getComponentByType('tabbed_content')).not.toBeNull();
    });

    it('resolves "media" to a non-null component', () => {
        expect(getComponentByType('media')).not.toBeNull();
    });

    it('resolves "icon_grid" to a non-null component', () => {
        expect(getComponentByType('icon_grid')).not.toBeNull();
    });

    it('resolves "code_block" to a non-null component', () => {
        expect(getComponentByType('code_block')).not.toBeNull();
    });

    it('returns null for an unknown content type', () => {
        expect(getComponentByType('__nonexistent_type__')).toBeNull();
    });

    it('is case-sensitive (does not resolve "Main" or "MAIN")', () => {
        expect(getComponentByType('Main')).toBeNull();
        expect(getComponentByType('MAIN')).toBeNull();
    });
});

describe('getComponentByType — stackwright-* dynamic components', () => {
    it('returns null and logs error when Image is not registered', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const result = getComponentByType('stackwright-image');
        expect(result).toBeNull();
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it('returns the registered Image component', () => {
        stackwrightRegistry.register({ Image: StubComponent });
        const result = getComponentByType('stackwright-image');
        expect(result).toBe(StubComponent);
    });

    it('returns null and logs error when Link is not registered', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const result = getComponentByType('stackwright-link');
        expect(result).toBeNull();
        consoleSpy.mockRestore();
    });

    it('returns null and logs error when Router is not registered', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const result = getComponentByType('stackwright-router');
        expect(result).toBeNull();
        consoleSpy.mockRestore();
    });

    it('returns null and logs error when Route is not registered', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const result = getComponentByType('stackwright-route');
        expect(result).toBeNull();
        consoleSpy.mockRestore();
    });
});

describe('registerComponent', () => {
    it('registers a new custom component type and retrieves it', () => {
        registerComponent('my-custom-widget', StubComponent);
        expect(getComponentByType('my-custom-widget')).toBe(StubComponent);
        // Clean up to avoid polluting other tests
        delete componentRegistry['my-custom-widget'];
    });

    it('overwrites an existing registration', () => {
        const StubA = (() => null) as unknown as ComponentType<any>;
        const StubB = (() => null) as unknown as ComponentType<any>;
        registerComponent('overwrite-test', StubA);
        registerComponent('overwrite-test', StubB);
        expect(getComponentByType('overwrite-test')).toBe(StubB);
        delete componentRegistry['overwrite-test'];
    });
});
