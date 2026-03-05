import React from 'react';
import { AppBarContent } from '@stackwright/types';
import { ThemedButton } from '../base/ThemedButton';
import { useSafeTheme } from '../../hooks/useSafeTheme';
import { getBetterTextColor, resolveColor } from '../../utils/colorUtils';
import { Media } from '../media/Media'

export default function TopAppBar({ title, logo, menuItems, textcolor, backgroundcolor }: AppBarContent) {
  const theme = useSafeTheme();

  const headerBgColor = backgroundcolor ? resolveColor(backgroundcolor, theme.colors) : theme.colors.primary;
  const headerTextColor = textcolor ? resolveColor(textcolor, theme.colors) : getBetterTextColor(theme.colors.text, theme.colors.textSecondary, headerBgColor)

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        backgroundColor: headerBgColor,
        color: headerTextColor,
        width: '100%',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <nav style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', padding: '0 24px' }}>
        {logo ? (
          <>
            <div style={{ paddingRight: '12px', height: 'auto' }}>
              <Media
                {...logo}
                style='contained'
                height={logo.height || '48px'}
                width={logo.width || '48px'}
                label={`${title} logo`}
              />
            </div>
            <h1 style={{ fontSize: '2.125rem', fontWeight: 400, margin: 0, marginRight: '32px' }}>
              {title}
            </h1>
          </>
        ) : (
          <h1 style={{ fontSize: '2.125rem', fontWeight: 400, margin: 0, marginRight: '32px' }}>
            {title}
          </h1>
        )}

        <div style={{ flexGrow: 1 }} />

        <div style={{ display: 'flex', gap: '16px' }}>
          {menuItems?.map((item, index) => (
            <ThemedButton
              key={index}
              button={{
                text: item.label,
                href: item.href,
                variant: 'text',
                bgColor: headerBgColor,
                textColor: headerTextColor,
                textSize: 'h6'
              }}
              size="medium"
            />
          ))}
        </div>
      </nav>
    </header>
  );
}
