import { FooterConfig, isNavigationSection } from '@stackwright/types';
import { useSafeTheme } from '../../hooks/useSafeTheme';
import { useBreakpoints } from '../../hooks/useBreakpoints';
import { getHighContrastTextColor, resolveColor } from '../../utils/colorUtils';

interface BottomAppBarProps {
  footer?: FooterConfig;
}

export default function BottomAppBar({ footer }: BottomAppBarProps) {
  const theme = useSafeTheme();
  const { isSmDown } = useBreakpoints();
  const currentYear = new Date().getFullYear();

  const backgroundColor = footer?.backgroundColor
    ? resolveColor(footer.backgroundColor, theme.colors)
    : theme.colors.primary;

  const textColor = footer?.textColor
    ? resolveColor(footer.textColor, theme.colors)
    : getHighContrastTextColor(backgroundColor, [
        theme.colors.text,
        theme.colors.textSecondary,
        '#ffffff',
        '#000000',
      ]);

  const hasLinks = footer?.links && footer.links.length > 0;
  const hasSocialLinks = footer?.socialLinks && footer.socialLinks.length > 0;
  const hasTopContent = hasLinks || hasSocialLinks;

  // Only chunk into columns when itemsPerColumn is explicitly configured.
  // Without it, links render in a horizontal row (the natural footer pattern).
  const useColumns = !!footer?.itemsPerColumn;
  const linkColumns: NonNullable<FooterConfig['links']>[] = [];
  if (hasLinks && useColumns) {
    const chunkSize = footer!.itemsPerColumn!;
    for (let i = 0; i < footer!.links!.length; i += chunkSize) {
      linkColumns.push(footer!.links!.slice(i, i + chunkSize));
    }
  }

  return (
    <footer
      style={{
        backgroundColor,
        color: textColor,
        padding: `${theme.spacing.md} ${theme.spacing.lg}`,
        marginTop: 'auto',
      }}
    >
      {/* Top section: links + social links */}
      {hasTopContent && (
        <div
          style={{
            display: 'flex',
            flexDirection: isSmDown ? 'column' : 'row',
            justifyContent: hasSocialLinks ? 'space-between' : 'center',
            alignItems: isSmDown ? 'flex-start' : 'center',
            flexWrap: 'wrap',
            gap: theme.spacing.md,
            paddingBottom: theme.spacing.md,
            marginBottom: theme.spacing.md,
            borderBottom: `1px solid rgba(128,128,128,0.25)`,
          }}
        >
          {/* Links: horizontal row by default, multi-column when itemsPerColumn is set */}
          {hasLinks &&
            (useColumns ? (
              <div style={{ display: 'flex', gap: theme.spacing.lg }}>
                {linkColumns.map((column, colIdx) => (
                  <div
                    key={colIdx}
                    style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}
                  >
                    {column!.map((link, linkIdx) =>
                      isNavigationSection(link) ? (
                        <div key={linkIdx}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: '0.78rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.07em',
                              opacity: 0.6,
                              marginBottom: '4px',
                            }}
                          >
                            {link.section}
                          </div>
                          {link.items.map((child) => (
                            <a
                              key={child.href}
                              href={child.href}
                              style={{
                                display: 'block',
                                color: 'inherit',
                                textDecoration: 'none',
                                fontSize: '0.875rem',
                                opacity: 0.9,
                              }}
                            >
                              {child.label}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <a
                          key={link.href}
                          href={link.href}
                          style={{
                            color: 'inherit',
                            textDecoration: 'none',
                            fontSize: '0.875rem',
                            opacity: 0.9,
                          }}
                        >
                          {link.label}
                        </a>
                      )
                    )}
                    <span
                      style={{
                        color: 'inherit',
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        opacity: 0.9,
                      }}
                    >
                      {footer?.copyright ?? `© ${currentYear} All rights reserved.`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: theme.spacing.md,
                  alignItems: 'center',
                }}
              >
                {footer!.links!.map((link, _linkIdx) =>
                  isNavigationSection(link) ? (
                    // Flatten section items into the row
                    link.items.map((child) => (
                      <a
                        key={child.href}
                        href={child.href}
                        style={{
                          color: 'inherit',
                          textDecoration: 'none',
                          fontSize: '0.875rem',
                          opacity: 0.9,
                        }}
                      >
                        {child.label}
                      </a>
                    ))
                  ) : (
                    <a
                      key={link.href}
                      href={link.href}
                      style={{
                        color: 'inherit',
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        opacity: 0.9,
                      }}
                    >
                      {link.label}
                    </a>
                  )
                )}
                <span
                  style={{
                    color: 'inherit',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    opacity: 0.9,
                  }}
                >
                  {footer?.copyright ?? `© ${currentYear} All rights reserved.`}
                </span>
              </div>
            ))}
        </div>
      )}
    </footer>
  );
}
