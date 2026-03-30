import React from 'react';
import { PricingTableContent } from '@stackwright/types';
import { useSafeTheme } from '../../hooks/useSafeTheme';
import { resolveColor } from '../../utils/colorUtils';
import { resolveBackground } from '../../utils/resolveBackground';
import { getThemeShadow } from '../../utils/shadowUtils';

export function PricingTable({ heading, plans, background }: PricingTableContent) {
  const theme = useSafeTheme();

  const headingColor = resolveColor(
    heading?.textColor ? heading.textColor : theme.colors.primary,
    theme.colors
  );

  return (
    <section
      style={{
        padding: `${theme.spacing['2xl']} ${theme.spacing.xl}`,
        background: resolveBackground(background, theme),
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
      <div
        style={{
          display: 'flex',
          gap: theme.spacing.lg,
          justifyContent: 'center',
          flexWrap: 'wrap',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {plans.map((plan, index) => {
          const isHighlighted = plan.highlighted === true;
          const borderColor = isHighlighted
            ? theme.colors.primary
            : theme.colors.secondary;

          return (
            <div
              key={index}
              style={{
                flex: '1 1 280px',
                maxWidth: '360px',
                backgroundColor: theme.colors.surface,
                borderRadius: '12px',
                border: `2px solid ${borderColor}`,
                padding: `${theme.spacing.xl} ${theme.spacing.lg}`,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                boxShadow: isHighlighted
                  ? getThemeShadow(theme, 'lg')
                  : getThemeShadow(theme, 'sm'),
              }}
            >
              {isHighlighted && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: theme.colors.primary,
                    color: theme.colors.surface,
                    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {plan.badge_text || 'Popular'}
                </span>
              )}
              <h4
                style={{
                  color: theme.colors.text,
                  margin: `0 0 ${theme.spacing.xs} 0`,
                  fontSize: '1.25rem',
                  fontWeight: 600,
                }}
              >
                {plan.name}
              </h4>
              <div
                style={{
                  color: theme.colors.primary,
                  fontSize: '2rem',
                  fontWeight: 700,
                  marginBottom: theme.spacing.xs,
                }}
              >
                {plan.price}
              </div>
              {plan.description && (
                <p
                  style={{
                    color: theme.colors.text,
                    opacity: 0.7,
                    margin: `0 0 ${theme.spacing.md} 0`,
                    fontSize: '0.875rem',
                  }}
                >
                  {plan.description}
                </p>
              )}
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: `0 0 ${theme.spacing.lg} 0`,
                  flex: 1,
                }}
              >
                {plan.features.map((feature, fi) => (
                  <li
                    key={fi}
                    style={{
                      padding: `${theme.spacing.xs} 0`,
                      color: theme.colors.text,
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.xs,
                    }}
                  >
                    <span style={{ color: theme.colors.primary }}>&#10003;</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href={plan.cta_href}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: `${theme.spacing.xs} ${theme.spacing.lg}`,
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  backgroundColor: isHighlighted ? theme.colors.primary : 'transparent',
                  color: isHighlighted ? theme.colors.surface : theme.colors.primary,
                  border: `2px solid ${theme.colors.primary}`,
                  transition: 'background-color 0.2s',
                }}
              >
                {plan.cta_text}
              </a>
            </div>
          );
        })}
      </div>
    </section>
  );
}
