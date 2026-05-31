import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { AriaLiveRegion } from '../../src/components/base/AriaLiveRegion';

describe('AriaLiveRegion', () => {
  it('renders a visually-hidden element with the message', () => {
    const { getByRole } = render(<AriaLiveRegion message="Test announcement" />);
    const region = getByRole('status');
    expect(region).toBeTruthy();
    expect(region.textContent).toBe('Test announcement');
  });

  it('uses role="status" and aria-live="polite" by default', () => {
    const { container } = render(<AriaLiveRegion message="Polite message" />);
    const el = container.firstChild as HTMLElement;
    expect(el.getAttribute('role')).toBe('status');
    expect(el.getAttribute('aria-live')).toBe('polite');
    expect(el.getAttribute('aria-atomic')).toBe('true');
  });

  it('uses role="alert" and aria-live="assertive" when politeness is assertive', () => {
    const { container } = render(
      <AriaLiveRegion message="Error occurred" politeness="assertive" />
    );
    const el = container.firstChild as HTMLElement;
    expect(el.getAttribute('role')).toBe('alert');
    expect(el.getAttribute('aria-live')).toBe('assertive');
  });

  it('is visually hidden (clip pattern applied)', () => {
    const { container } = render(<AriaLiveRegion message="Hidden message" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.position).toBe('absolute');
    expect(el.style.width).toBe('1px');
    expect(el.style.height).toBe('1px');
    expect(el.style.overflow).toBe('hidden');
  });

  it('updates message content when prop changes', () => {
    const { rerender, getByRole } = render(<AriaLiveRegion message="First message" />);
    expect(getByRole('status').textContent).toBe('First message');
    rerender(<AriaLiveRegion message="Second message" />);
    expect(getByRole('status').textContent).toBe('Second message');
  });
});
