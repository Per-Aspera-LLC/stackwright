import React from 'react';

/** Visually-hidden live region that announces dynamic state changes to screen readers. */
export interface AriaLiveRegionProps {
  /** The message to announce. Update this string to trigger an announcement. */
  message: string;
  /** 'polite' waits for the user to finish; 'assertive' interrupts immediately. Default: 'polite' */
  politeness?: 'polite' | 'assertive';
}

/** CSS clip pattern for visually hiding an element while keeping it in the a11y tree. */
const VISUALLY_HIDDEN: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

/**
 * Renders a visually-hidden element with `aria-live` that announces `message`
 * to screen readers whenever it changes. Use `politeness="assertive"` for
 * errors/warnings; keep the default `"polite"` for non-critical updates.
 */
export function AriaLiveRegion({ message, politeness = 'polite' }: AriaLiveRegionProps) {
  return (
    <div
      role={politeness === 'assertive' ? 'alert' : 'status'}
      aria-live={politeness}
      aria-atomic="true"
      style={VISUALLY_HIDDEN}
    >
      {message}
    </div>
  );
}
