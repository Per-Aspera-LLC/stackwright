import React from 'react';
import { FooterConfig } from '@stackwright/types';
import { useSafeTheme } from '../../hooks/useSafeTheme';
import { getBetterTextColor, resolveColor } from '../../utils/colorUtils';
import { ThemedButton } from '../base/ThemedButton';

interface BottomAppBarProps {
  footer?: FooterConfig;
}

export default function BottomAppBar({ footer }: BottomAppBarProps) {
  const theme = useSafeTheme();
  const currentYear = new Date().getFullYear();

  const backgroundColor = footer?.backgroundColor ? resolveColor(footer?.backgroundColor, theme.colors) : theme.colors.primary;
  const textColor = footer?.textColor ? resolveColor(footer.textColor, theme.colors) : getBetterTextColor(theme.colors.text, theme.colors.textSecondary, backgroundColor)

  return (
    <footer
      style={{
        backgroundColor: backgroundColor,
        color: textColor,
        padding: '8px 16px',
        marginTop: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        minHeight: '32px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '8px',
          padding: '0 20px',
        }}
      >
        {footer?.links && footer.links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            style={{
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            {link.label}
          </a>
        ))}

        {footer?.socialLinks && (
          <div style={{
            display: 'flex',
            flexDirection: footer.socialLinks.length > 3 ? 'column' : 'row',
            gap: '8px',
          }}>
            <h4 style={{ margin: 0, paddingLeft: '40px', fontWeight: 'bold' }}>
              {footer?.socialText || "Social Media"}
            </h4>
            {footer.socialLinks.map((social, index) => (
              <ThemedButton key={social.href || index} button={social} />
            ))}
          </div>
        )}
      </div>

      <div style={{ width: '100%', textAlign: 'center' }}>
        <span style={{ fontSize: '0.875rem' }}>
          {`@ ${currentYear} ${footer?.copyright}` || `© ${currentYear} All rights reserved.`}
        </span>
      </div>
    </footer>
  );
}
