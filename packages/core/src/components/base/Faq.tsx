import React from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import { FaqContent } from '@stackwright/types';
import { useSafeColorMode, useSafeTheme } from '../../hooks/useSafeTheme';
import { resolveColor } from '../../utils/colorUtils';
import { resolveBackground } from '../../utils/resolveBackground';
import { getThemeShadow } from '../../utils/shadowUtils';

/**
 * FAQ accordion component built on @radix-ui/react-accordion.
 *
 * Replaces the previous <details>/<summary> implementation which overrode
 * native disclosure widget behavior (listStyle: none + display: flex on
 * <summary>) and caused a keyboard trap in Chromium. Radix Accordion handles
 * all keyboard interactions correctly: Enter/Space to toggle, Tab to move
 * between items, no traps. (WCAG 2.1.1, 2.1.2)
 *
 * type="multiple" lets users keep several answers open at once — friendlier
 * for scanning a docs page than forcing single-open.
 */
export function Faq({ heading, items, background }: FaqContent) {
  const theme = useSafeTheme();
  const resolvedColorMode = useSafeColorMode();
  const [openItems, setOpenItems] = React.useState<string[]>([]);

  const headingColor = resolveColor(
    heading?.textColor ? heading.textColor : theme.colors.primary,
    theme.colors
  );

  return (
    <section
      style={{
        padding: `${theme.spacing['2xl']} ${theme.spacing.xl}`,
        background: resolveBackground(background, theme, resolvedColorMode === 'dark'),
      }}
    >
      {heading?.text && (
        <h3
          style={{
            color: headingColor,
            marginBottom: theme.spacing.xl,
            textAlign: 'center',
          }}
        >
          {heading.text}
        </h3>
      )}

      {/* Accordion.Root renders as <div> — style it as the flex column container */}
      <Accordion.Root
        type="multiple"
        value={openItems}
        onValueChange={setOpenItems}
        style={{
          maxWidth: '768px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing.xs,
        }}
      >
        {items.map((item, index) => {
          const value = `item-${index}`;
          const isOpen = openItems.includes(value);

          return (
            <Accordion.Item
              key={index}
              value={value}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: getThemeShadow(theme, 'sm'),
              }}
            >
              {/*
               * Accordion.Header defaults to <h3>. Using asChild + <div> to
               * avoid stacking multiple h3s alongside the section heading above —
               * the WAI-ARIA accordion pattern requires a button inside a heading,
               * but heading level depends on page context. Omitting the heading
               * element here keeps Radix's ARIA button management while leaving
               * heading hierarchy to the page author.
               */}
              <Accordion.Header asChild>
                <div>
                  <Accordion.Trigger
                    style={{
                      width: '100%',
                      padding: `${theme.spacing.md} ${theme.spacing.md}`,
                      cursor: 'pointer',
                      fontWeight: 600,
                      color: theme.colors.text,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                      fontSize: 'inherit',
                    }}
                  >
                    {item.question}
                    <span
                      aria-hidden="true"
                      style={{
                        marginLeft: theme.spacing.md,
                        flexShrink: 0,
                        fontSize: '1.25rem',
                        lineHeight: 1,
                      }}
                    >
                      {isOpen ? '−' : '+'}
                    </span>
                  </Accordion.Trigger>
                </div>
              </Accordion.Header>

              {/* Accordion.Content unmounts from DOM when closed (no forceMount) */}
              <Accordion.Content>
                <div
                  style={{
                    padding: `0 ${theme.spacing.md} ${theme.spacing.md} ${theme.spacing.md}`,
                    color: theme.colors.text,
                    opacity: 0.8,
                    lineHeight: 1.6,
                  }}
                >
                  {item.answer}
                </div>
              </Accordion.Content>
            </Accordion.Item>
          );
        })}
      </Accordion.Root>
    </section>
  );
}
