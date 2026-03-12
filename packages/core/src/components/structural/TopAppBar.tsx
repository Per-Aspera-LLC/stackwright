import React, { useState } from 'react';
import { AppBarContent, NavigationItem } from '@stackwright/types';
import { ThemedButton } from '../base/ThemedButton';
import { CompressedMenu } from '../base/Menu/CompressedMenu';
import { useSafeTheme } from '../../hooks/useSafeTheme';
import { getBetterTextColor, resolveColor } from '../../utils/colorUtils';
import { Media } from '../media/Media';
import { useBreakpoints } from '../../hooks/useBreakpoints';
import { useThemeOptional } from '@stackwright/themes';
import { getIconRegistry } from '../../utils/stackwrightComponentRegistry';

// ---------------------------------------------------------------------------
// Color Mode Toggle
// ---------------------------------------------------------------------------

function ColorModeToggle({ textColor }: { textColor: string }) {
  const themeCtx = useThemeOptional();
  if (!themeCtx) return null;

  const { resolvedColorMode, setColorMode } = themeCtx;

  // Try to grab Sun/Moon from the icon registry, fall back to text labels
  const registry = getIconRegistry();
  const SunIcon = registry?.get('Sun');
  const MoonIcon = registry?.get('Moon');

  const handleToggle = () => {
    setColorMode(resolvedColorMode === 'dark' ? 'light' : 'dark');
  };

  const label = resolvedColorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      onClick={handleToggle}
      aria-label={label}
      title={label}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: textColor,
        padding: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        transition: 'background-color 0.2s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.15)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
      }}
    >
      {resolvedColorMode === 'dark' ? (
        SunIcon ? (
          <SunIcon size={22} />
        ) : (
          '☀️'
        )
      ) : MoonIcon ? (
        <MoonIcon size={22} />
      ) : (
        '🌙'
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// TopAppBar
// ---------------------------------------------------------------------------

export default function TopAppBar({
  title,
  logo,
  menuItems,
  textcolor,
  backgroundcolor,
  colorModeToggle,
}: AppBarContent) {
  const theme = useSafeTheme();
  const { isSmDown } = useBreakpoints();
  const [menuOpen, setMenuOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const headerBgColor = backgroundcolor
    ? resolveColor(backgroundcolor, theme.colors)
    : theme.colors.primary;
  const headerTextColor = textcolor
    ? resolveColor(textcolor, theme.colors)
    : getBetterTextColor(theme.colors.text, theme.colors.textSecondary, headerBgColor);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setMenuOpen(true);
  };

  const handleMenuClose = () => {
    setMenuOpen(false);
    setAnchorEl(null);
  };

  const buildMenu = (items: NavigationItem[]) => (
    <>
      {items.map((item, index) => (
        <a
          key={index}
          href={item.href}
          onClick={handleMenuClose}
          style={{
            display: 'block',
            padding: `${theme.spacing.xs} ${theme.spacing.md}`,
            color: theme.colors.text,
            textDecoration: 'none',
            fontSize: '1rem',
          }}
        >
          {item.label}
        </a>
      ))}
    </>
  );

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
      <nav
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          padding: `0 ${theme.spacing.lg}`,
        }}
      >
        {logo ? (
          <>
            <div style={{ paddingRight: theme.spacing.sm, height: 'auto' }}>
              <Media
                {...logo}
                style="contained"
                height={logo.height || '48px'}
                width={logo.width || '48px'}
                label={`${title} logo`}
              />
            </div>
            <h1
              style={{
                fontSize: '2.125rem',
                fontWeight: 400,
                margin: 0,
                marginRight: theme.spacing.xl,
              }}
            >
              {title}
            </h1>
          </>
        ) : (
          <h1
            style={{
              fontSize: '2.125rem',
              fontWeight: 400,
              margin: 0,
              marginRight: theme.spacing.xl,
            }}
          >
            {title}
          </h1>
        )}

        <div style={{ flexGrow: 1 }} />

        {menuItems &&
          menuItems.length > 0 &&
          (isSmDown ? (
            <CompressedMenu
              menuItems={menuItems}
              menuOpen={menuOpen}
              anchorEl={anchorEl}
              onMenuOpen={handleMenuOpen}
              onMenuClose={handleMenuClose}
              buildMenu={buildMenu}
            />
          ) : (
            <div style={{ display: 'flex', gap: theme.spacing.md, alignItems: 'center' }}>
              {menuItems.map((item, index) => (
                <ThemedButton
                  key={index}
                  button={{
                    text: item.label,
                    href: item.href,
                    variant: 'text',
                    bgColor: headerBgColor,
                    textColor: headerTextColor,
                    textSize: 'h6',
                  }}
                  size="medium"
                />
              ))}
              {colorModeToggle && <ColorModeToggle textColor={headerTextColor} />}
            </div>
          ))}

        {/* Show toggle even without menu items, or on mobile */}
        {colorModeToggle && (!menuItems || menuItems.length === 0 || isSmDown) && (
          <ColorModeToggle textColor={headerTextColor} />
        )}
      </nav>
    </header>
  );
}
