import React, { useId, useState } from 'react';
import {
  AppBarContent,
  NavigationItem,
  NavigationSection,
  isNavigationSection,
} from '@stackwright/types';
import { ThemedButton } from '../base/ThemedButton';
import { CompressedMenu } from '../base/Menu/CompressedMenu';
import { useSafeTheme } from '../../hooks/useSafeTheme';
import { getBetterTextColor, resolveColor } from '../../utils/colorUtils';
import { Media } from '../media/Media';
import { useBreakpoints } from '../../hooks/useBreakpoints';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getThemeShadow } from '../../utils/shadowUtils';
import { useThemeOptional } from '@stackwright/themes';
import { getIconRegistry } from '../../utils/stackwrightComponentRegistry';

// ---------------------------------------------------------------------------
// Color Mode Toggle
// ---------------------------------------------------------------------------

function ColorModeToggle({ textColor }: { textColor: string }) {
  const themeCtx = useThemeOptional();
  const uniqueId = useId();
  const reducedMotion = useReducedMotion();
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

  // CSS class for hover — avoids direct DOM style mutation (#159)
  const hoverClass = `sw-cm-toggle-${uniqueId.replace(/:/g, '')}`;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `.${hoverClass}:hover { background-color: rgba(255,255,255,0.15) !important; }`,
        }}
      />
      <button
        className={hoverClass}
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
          transition: reducedMotion ? 'none' : 'background-color 0.2s',
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
    </>
  );
}

// ---------------------------------------------------------------------------
// NavDropdown — desktop hover dropdown for NavigationSection items
// ---------------------------------------------------------------------------

interface NavDropdownProps {
  section: NavigationSection;
  headerTextColor: string;
  dropdownBgColor: string;
  dropdownTextColor: string;
  shadow: string;
  spacingXs: string;
  spacingMd: string;
}

function NavDropdown({
  section,
  headerTextColor,
  dropdownBgColor,
  dropdownTextColor,
  shadow,
  spacingXs,
  spacingMd,
}: NavDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: headerTextColor,
          padding: `6px ${spacingMd}`,
          fontSize: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontFamily: 'inherit',
          fontWeight: 'inherit',
        }}
      >
        {section.section}
        <span style={{ fontSize: '0.65em', opacity: 0.8, lineHeight: 1 }}>▾</span>
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            backgroundColor: dropdownBgColor,
            boxShadow: shadow,
            borderRadius: '6px',
            minWidth: '160px',
            zIndex: 1200,
            padding: `${spacingXs} 0`,
          }}
        >
          {section.items.map((link, idx) => (
            <a
              key={idx}
              href={link.href}
              style={{
                display: 'block',
                padding: `${spacingXs} ${spacingMd}`,
                color: dropdownTextColor,
                textDecoration: 'none',
                fontSize: '1rem',
                whiteSpace: 'nowrap',
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
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
      {items.map((item, index) => {
        if (isNavigationSection(item)) {
          // Flatten sections with exactly one item — no orphaned group headers
          if (item.items.length === 1) {
            const single = item.items[0];
            return (
              <a
                key={index}
                href={single.href}
                onClick={handleMenuClose}
                style={{
                  display: 'block',
                  padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                  color: theme.colors.text,
                  textDecoration: 'none',
                  fontSize: '1rem',
                }}
              >
                {single.label}
              </a>
            );
          }
          return (
            <div key={index}>
              <div
                style={{
                  padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                  paddingTop: index === 0 ? theme.spacing.xs : theme.spacing.sm,
                  fontWeight: 600,
                  opacity: 0.55,
                  fontSize: '0.78rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  color: theme.colors.text,
                  cursor: 'default',
                }}
              >
                {item.section}
              </div>
              {item.items.map((link, linkIndex) => (
                <a
                  key={linkIndex}
                  href={link.href}
                  onClick={handleMenuClose}
                  style={{
                    display: 'block',
                    padding: `${theme.spacing.xs} ${theme.spacing.lg}`,
                    color: theme.colors.text,
                    textDecoration: 'none',
                    fontSize: '1rem',
                  }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          );
        }
        // Plain link
        return (
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
        );
      })}
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
        boxShadow: getThemeShadow(theme, 'md'),
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
            {title ? (
              <h1
                style={{
                  fontSize: 'clamp(1rem, 4vw, 2.125rem)',
                  fontWeight: 400,
                  margin: 0,
                  marginRight: theme.spacing.xl,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  minWidth: 0,
                  flexShrink: 1,
                }}
              >
                {title}
              </h1>
            ) : (
              <h1
                style={{
                  position: 'absolute',
                  width: '1px',
                  height: '1px',
                  overflow: 'hidden',
                  clip: 'rect(0,0,0,0)',
                  whiteSpace: 'nowrap',
                  margin: 0,
                  padding: 0,
                  border: 0,
                }}
              >
                {(logo as { alt?: string }).alt || 'Home'}
              </h1>
            )}
          </>
        ) : (
          <h1
            style={{
              fontSize: 'clamp(1rem, 4vw, 2.125rem)',
              fontWeight: 400,
              margin: 0,
              marginRight: theme.spacing.xl,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minWidth: 0,
              flexShrink: 1,
            }}
          >
            {title}
          </h1>
        )}

        <div style={{ flexGrow: 1 }} />

        {/* Mobile: toggle appears LEFT of hamburger */}
        {colorModeToggle && isSmDown && <ColorModeToggle textColor={headerTextColor} />}

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
              textColor={headerTextColor}
              menuBackground={theme.colors.background}
            />
          ) : (
            <div style={{ display: 'flex', gap: theme.spacing.md, alignItems: 'center' }}>
              {menuItems.map((item, index) => {
                if (isNavigationSection(item)) {
                  // Flatten sections with exactly one item
                  if (item.items.length === 1) {
                    const single = item.items[0];
                    return (
                      <ThemedButton
                        key={index}
                        button={{
                          text: single.label,
                          href: single.href,
                          variant: 'text',
                          bgColor: headerBgColor,
                          textColor: headerTextColor,
                          textSize: 'h6',
                        }}
                        size="medium"
                      />
                    );
                  }
                  return (
                    <NavDropdown
                      key={index}
                      section={item}
                      headerTextColor={headerTextColor}
                      dropdownBgColor={theme.colors.background}
                      dropdownTextColor={theme.colors.text}
                      shadow={getThemeShadow(theme, 'md')}
                      spacingXs={theme.spacing.xs}
                      spacingMd={theme.spacing.md}
                    />
                  );
                }
                // Plain link
                return (
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
                );
              })}
            </div>
          ))}

        {/* Desktop: toggle appears RIGHT of nav links (original position) */}
        {colorModeToggle && !isSmDown && <ColorModeToggle textColor={headerTextColor} />}

        {colorModeToggle && (!menuItems || menuItems.length === 0) && (
          <ColorModeToggle textColor={headerTextColor} />
        )}
      </nav>
    </header>
  );
}
