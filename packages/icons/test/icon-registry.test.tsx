import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import {
  stackwrightIconRegistry,
  registerStackwrightIcon,
  registerStackwrightIcons,
} from '../src/registry/iconRegistry';
import { useStackwrightIcon } from '../src/hooks/useStackwrightIcon';
import { registerDefaultIcons, defaultStackwrightIcons } from '../src/presets/defaultIcons';
import { lucideIconPreset, registerLucideIcons } from '../src/presets/lucideIcons';
import { lucideAllIconsPreset, registerAllLucideIcons } from '../src/presets/lucideAllIcons';
import { BlueSkyIcon } from '../src/icons/social/BlueSkyIcon';
import { StackwrightIcon } from '../src/icons/brand/StackwrightIcon';

// ---------------------------------------------------------------------------
// Icon Registry — core registration and lookup
// ---------------------------------------------------------------------------

describe('stackwrightIconRegistry', () => {
  beforeEach(() => {
    stackwrightIconRegistry.clear();
  });

  it('starts empty after clear', () => {
    expect(stackwrightIconRegistry.getRegisteredIcons()).toHaveLength(0);
  });

  it('registers and retrieves a single icon', () => {
    const TestIcon = () => <svg data-testid="test-icon" />;
    stackwrightIconRegistry.register('test', TestIcon);

    expect(stackwrightIconRegistry.isRegistered('test')).toBe(true);
    expect(stackwrightIconRegistry.get('test')).toBe(TestIcon);
  });

  it('returns undefined for unregistered icons', () => {
    expect(stackwrightIconRegistry.get('nonexistent')).toBeUndefined();
    expect(stackwrightIconRegistry.isRegistered('nonexistent')).toBe(false);
  });

  it('lists all registered icon names', () => {
    const IconA = () => <svg />;
    const IconB = () => <svg />;
    stackwrightIconRegistry.register('alpha', IconA);
    stackwrightIconRegistry.register('beta', IconB);

    const names = stackwrightIconRegistry.getRegisteredIcons();
    expect(names).toContain('alpha');
    expect(names).toContain('beta');
    expect(names).toHaveLength(2);
  });

  it('overwrites an icon when registered with the same name', () => {
    const Original = () => <svg data-testid="original" />;
    const Replacement = () => <svg data-testid="replacement" />;

    stackwrightIconRegistry.register('icon', Original);
    stackwrightIconRegistry.register('icon', Replacement);

    expect(stackwrightIconRegistry.get('icon')).toBe(Replacement);
    expect(stackwrightIconRegistry.getRegisteredIcons()).toHaveLength(1);
  });

  it('clear removes all icons', () => {
    stackwrightIconRegistry.register('a', () => <svg />);
    stackwrightIconRegistry.register('b', () => <svg />);
    expect(stackwrightIconRegistry.getRegisteredIcons()).toHaveLength(2);

    stackwrightIconRegistry.clear();
    expect(stackwrightIconRegistry.getRegisteredIcons()).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Convenience registration functions
// ---------------------------------------------------------------------------

describe('registerStackwrightIcon', () => {
  beforeEach(() => {
    stackwrightIconRegistry.clear();
  });

  it('registers a single icon via convenience function', () => {
    const TestIcon = () => <svg />;
    registerStackwrightIcon('test', TestIcon);

    expect(stackwrightIconRegistry.isRegistered('test')).toBe(true);
    expect(stackwrightIconRegistry.get('test')).toBe(TestIcon);
  });
});

describe('registerStackwrightIcons', () => {
  beforeEach(() => {
    stackwrightIconRegistry.clear();
  });

  it('registers multiple icons from a record', () => {
    const IconA = () => <svg />;
    const IconB = () => <svg />;
    registerStackwrightIcons({ alpha: IconA, beta: IconB });

    expect(stackwrightIconRegistry.isRegistered('alpha')).toBe(true);
    expect(stackwrightIconRegistry.isRegistered('beta')).toBe(true);
    expect(stackwrightIconRegistry.get('alpha')).toBe(IconA);
  });
});

// ---------------------------------------------------------------------------
// useStackwrightIcon hook
// ---------------------------------------------------------------------------

describe('useStackwrightIcon', () => {
  beforeEach(() => {
    stackwrightIconRegistry.clear();
  });

  function HookTester({ name }: { name: string }) {
    const { IconComponent, isRegistered, allRegisteredIcons } = useStackwrightIcon(name);
    return (
      <div>
        <span data-testid="registered">{String(isRegistered)}</span>
        <span data-testid="count">{allRegisteredIcons.length}</span>
        {IconComponent && <IconComponent data-testid="rendered-icon" />}
      </div>
    );
  }

  it('returns icon component when registered', () => {
    const TestIcon = (props: any) => <svg data-testid="rendered-icon" {...props} />;
    registerStackwrightIcon('test', TestIcon);

    render(<HookTester name="test" />);
    expect(screen.getByTestId('registered')).toHaveTextContent('true');
    expect(screen.getByTestId('rendered-icon')).toBeInTheDocument();
  });

  it('returns isRegistered=false for unregistered icons', () => {
    render(<HookTester name="missing" />);
    expect(screen.getByTestId('registered')).toHaveTextContent('false');
    expect(screen.queryByTestId('rendered-icon')).not.toBeInTheDocument();
  });

  it('returns count of all registered icons', () => {
    registerStackwrightIcons({ a: () => <svg />, b: () => <svg />, c: () => <svg /> });
    render(<HookTester name="a" />);
    expect(screen.getByTestId('count')).toHaveTextContent('3');
  });
});

// ---------------------------------------------------------------------------
// Lucide icon preset
// ---------------------------------------------------------------------------

describe('lucideIconPreset', () => {
  beforeEach(() => {
    stackwrightIconRegistry.clear();
  });

  it('contains expected MUI-compatible icon names', () => {
    // These keys match the legacy MUI names for YAML backward compatibility
    expect(lucideIconPreset).toHaveProperty('Speed');
    expect(lucideIconPreset).toHaveProperty('VerifiedUser');
    expect(lucideIconPreset).toHaveProperty('CloudDone');
    expect(lucideIconPreset).toHaveProperty('Palette');
    expect(lucideIconPreset).toHaveProperty('Code');
    expect(lucideIconPreset).toHaveProperty('Star');
    expect(lucideIconPreset).toHaveProperty('Rocket');
    expect(lucideIconPreset).toHaveProperty('Lock');
    expect(lucideIconPreset).toHaveProperty('Dashboard');
    expect(lucideIconPreset).toHaveProperty('Info');
    expect(lucideIconPreset).toHaveProperty('AlertTriangle');
  });

  it('all preset values are valid React components', () => {
    for (const [name, component] of Object.entries(lucideIconPreset)) {
      // Lucide icons may be forwardRef objects or plain function components
      const isRenderable = typeof component === 'function' || typeof component === 'object';
      expect(isRenderable, `${name} should be a React component`).toBe(true);
    }
  });

  it('registerLucideIcons registers all preset icons into the registry', () => {
    registerLucideIcons();

    const registered = stackwrightIconRegistry.getRegisteredIcons();
    expect(registered.length).toBe(Object.keys(lucideIconPreset).length);

    for (const name of Object.keys(lucideIconPreset)) {
      expect(stackwrightIconRegistry.isRegistered(name)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Default icons preset
// ---------------------------------------------------------------------------

describe('defaultStackwrightIcons', () => {
  beforeEach(() => {
    stackwrightIconRegistry.clear();
  });

  it('includes BlueSky custom icon', () => {
    expect(defaultStackwrightIcons).toHaveProperty('bluesky');
    expect(defaultStackwrightIcons.bluesky).toBe(BlueSkyIcon);
  });

  it('includes Stackwright brand icon', () => {
    expect(defaultStackwrightIcons).toHaveProperty('stackwright');
    expect(defaultStackwrightIcons.stackwright).toBe(StackwrightIcon);
  });

  it('includes all lucide icons from the full set', () => {
    for (const name of Object.keys(lucideAllIconsPreset)) {
      expect(defaultStackwrightIcons).toHaveProperty(name);
    }
  });

  it('registerDefaultIcons registers all defaults into the registry', () => {
    registerDefaultIcons();

    const registered = stackwrightIconRegistry.getRegisteredIcons();
    expect(registered.length).toBe(Object.keys(defaultStackwrightIcons).length);
    expect(stackwrightIconRegistry.isRegistered('bluesky')).toBe(true);
    expect(stackwrightIconRegistry.isRegistered('stackwright')).toBe(true);
    // Legacy MUI alias
    expect(stackwrightIconRegistry.isRegistered('Speed')).toBe(true);
    // Full Lucide set — these icons were NOT in the curated preset
    expect(stackwrightIconRegistry.isRegistered('Heart')).toBe(true);
    expect(stackwrightIconRegistry.isRegistered('Camera')).toBe(true);
    expect(stackwrightIconRegistry.isRegistered('Truck')).toBe(true);
    // Should have significantly more than the curated preset
    expect(registered.length).toBeGreaterThan(500);
  });
});

// ---------------------------------------------------------------------------
// Full Lucide icon preset (all icons)
// ---------------------------------------------------------------------------

describe('lucideAllIconsPreset', () => {
  beforeEach(() => {
    stackwrightIconRegistry.clear();
  });

  it('contains significantly more icons than the curated preset', () => {
    const allCount = Object.keys(lucideAllIconsPreset).length;
    const curatedCount = Object.keys(lucideIconPreset).length;
    expect(allCount).toBeGreaterThan(curatedCount * 10);
  });

  it('contains expected common Lucide icons not in curated preset', () => {
    expect(lucideAllIconsPreset).toHaveProperty('Heart');
    expect(lucideAllIconsPreset).toHaveProperty('Camera');
    expect(lucideAllIconsPreset).toHaveProperty('Truck');
    expect(lucideAllIconsPreset).toHaveProperty('Wifi');
    expect(lucideAllIconsPreset).toHaveProperty('Phone');
    expect(lucideAllIconsPreset).toHaveProperty('Mail');
  });

  it('preserves legacy MUI aliases', () => {
    expect(lucideAllIconsPreset).toHaveProperty('Speed');
    expect(lucideAllIconsPreset).toHaveProperty('VerifiedUser');
    expect(lucideAllIconsPreset).toHaveProperty('Dashboard');
    expect(lucideAllIconsPreset).toHaveProperty('Api');
  });

  it('preserves Lucide renamed-icon aliases', () => {
    expect(lucideAllIconsPreset).toHaveProperty('CheckCircle');
    expect(lucideAllIconsPreset).toHaveProperty('AlertTriangle');
  });

  it('all preset values are valid React components', () => {
    for (const [name, component] of Object.entries(lucideAllIconsPreset)) {
      const isRenderable = typeof component === 'function' || typeof component === 'object';
      expect(isRenderable, `${name} should be a React component`).toBe(true);
    }
  });

  it('registerAllLucideIcons registers all preset icons into the registry', () => {
    registerAllLucideIcons();

    const registered = stackwrightIconRegistry.getRegisteredIcons();
    expect(registered.length).toBe(Object.keys(lucideAllIconsPreset).length);

    // Spot-check several icons
    expect(stackwrightIconRegistry.isRegistered('Heart')).toBe(true);
    expect(stackwrightIconRegistry.isRegistered('Zap')).toBe(true);
    expect(stackwrightIconRegistry.isRegistered('Speed')).toBe(true); // MUI alias
  });
});

// ---------------------------------------------------------------------------
// Custom icons render correctly
// ---------------------------------------------------------------------------

describe('BlueSkyIcon', () => {
  it('renders an SVG with default size', () => {
    const { container } = render(<BlueSkyIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('accepts custom size and color', () => {
    const { container } = render(<BlueSkyIcon size={48} color="#1DA1F2" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '48');
    expect(svg).toHaveAttribute('fill', '#1DA1F2');
  });
});

describe('StackwrightIcon', () => {
  it('renders an SVG with default size', () => {
    const { container } = render(<StackwrightIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
  });

  it('accepts className and style', () => {
    const { container } = render(
      <StackwrightIcon className="brand-icon" style={{ opacity: 0.5 }} />
    );
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('brand-icon');
    expect(svg).toHaveStyle({ opacity: '0.5' });
  });
});

// ---------------------------------------------------------------------------
// Global registry accessor
// ---------------------------------------------------------------------------

describe('global icon registry', () => {
  it('is accessible via globalThis.__stackwright_icon_registry__', () => {
    const globalRegistry = (globalThis as any).__stackwright_icon_registry__;
    expect(globalRegistry).toBeDefined();
    expect(globalRegistry).toBe(stackwrightIconRegistry);
  });
});
