import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentType } from 'react';
import {
  stackwrightRegistry,
  registerStackwrightComponents,
} from '../../src/utils/stackwrightComponentRegistry';

// Minimal stub components for testing
const StubImage = (() => null) as unknown as ComponentType<any>;
const StubLink = (() => null) as unknown as ComponentType<any>;
const StubRouter = (() => null) as unknown as ComponentType<any>;
const StubRoute = (() => null) as unknown as ComponentType<any>;

beforeEach(() => {
  stackwrightRegistry.clear();
});

describe('stackwrightRegistry.register / get', () => {
  it('registers a component and retrieves it', () => {
    stackwrightRegistry.register({ Image: StubImage });
    expect(stackwrightRegistry.get('Image')).toBe(StubImage);
  });

  it('registers multiple components in one call', () => {
    stackwrightRegistry.register({ Image: StubImage, Link: StubLink });
    expect(stackwrightRegistry.get('Image')).toBe(StubImage);
    expect(stackwrightRegistry.get('Link')).toBe(StubLink);
  });

  it('merges subsequent register calls', () => {
    stackwrightRegistry.register({ Image: StubImage });
    stackwrightRegistry.register({ Link: StubLink });
    expect(stackwrightRegistry.get('Image')).toBe(StubImage);
    expect(stackwrightRegistry.get('Link')).toBe(StubLink);
  });

  it('overwriting a component with a second register replaces it', () => {
    const StubImage2 = (() => null) as unknown as ComponentType<any>;
    stackwrightRegistry.register({ Image: StubImage });
    stackwrightRegistry.register({ Image: StubImage2 });
    expect(stackwrightRegistry.get('Image')).toBe(StubImage2);
  });

  it('get throws with a descriptive message when component is not registered', () => {
    expect(() => stackwrightRegistry.get('Image')).toThrow(
      "Stackwright component 'Image' is not registered"
    );
  });

  it('get throws for Link when not registered', () => {
    expect(() => stackwrightRegistry.get('Link')).toThrow(
      "Stackwright component 'Link' is not registered"
    );
  });
});

describe('stackwrightRegistry.isRegistered', () => {
  it('returns false before registration', () => {
    expect(stackwrightRegistry.isRegistered('Image')).toBe(false);
  });

  it('returns true after registration', () => {
    stackwrightRegistry.register({ Image: StubImage });
    expect(stackwrightRegistry.isRegistered('Image')).toBe(true);
  });

  it('returns false after clear', () => {
    stackwrightRegistry.register({ Image: StubImage });
    stackwrightRegistry.clear();
    expect(stackwrightRegistry.isRegistered('Image')).toBe(false);
  });
});

describe('stackwrightRegistry.getAll', () => {
  it('throws when required components are missing', () => {
    // Only Image registered; Link, Router, Route missing
    stackwrightRegistry.register({ Image: StubImage });
    expect(() => stackwrightRegistry.getAll()).toThrow(
      "Required stackwright component 'Link' is not registered"
    );
  });

  it('throws when no components are registered', () => {
    expect(() => stackwrightRegistry.getAll()).toThrow(
      "Required stackwright component 'Image' is not registered"
    );
  });

  it('returns all components when all four are registered', () => {
    stackwrightRegistry.register({
      Image: StubImage,
      Link: StubLink,
      Router: StubRouter,
      Route: StubRoute,
    });
    const all = stackwrightRegistry.getAll();
    expect(all.Image).toBe(StubImage);
    expect(all.Link).toBe(StubLink);
    expect(all.Router).toBe(StubRouter);
    expect(all.Route).toBe(StubRoute);
  });
});

describe('registerStackwrightComponents (convenience wrapper)', () => {
  it('delegates to stackwrightRegistry.register', () => {
    registerStackwrightComponents({ Image: StubImage });
    expect(stackwrightRegistry.isRegistered('Image')).toBe(true);
    expect(stackwrightRegistry.get('Image')).toBe(StubImage);
  });
});
