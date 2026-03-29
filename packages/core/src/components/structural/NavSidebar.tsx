import React, { useId, useState, useEffect, useRef } from 'react';
import { NavigationItem } from '@stackwright/types';
import { useSafeTheme } from '../../hooks/useSafeTheme';
import { resolveColor, getBetterTextColor } from '../../utils/colorUtils';
import { getThemeShadow } from '../../utils/shadowUtils';
import { getIconRegistry } from '../../utils/stackwrightComponentRegistry';

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export interface NavSidebarProps {
  navigationItems: NavigationItem[];
  collapsed?: boolean;
  width?: number;
  mobileBreakpoint?: number;
  backgroundColor?: string;
  textColor?: string;
  onCollapseToggle?: (collapsed: boolean) => void;
}

interface NavItemProps {
  item: NavigationItem;
  isActive: boolean;
  collapsed: boolean;
  textColor: string;
  activeColor: string;
  theme: any;
  depth?: number;
}

// ---------------------------------------------------------------------------
// 🧭 NavSidebar Debug Logger
// ---------------------------------------------------------------------------

const DEBUG = false; // Toggle for debugging
function navLog(...args: any[]) {
  if (DEBUG) console.log('🧭 NavSidebar:', ...args);
}

// ---------------------------------------------------------------------------
// Navigation Item Component
// ---------------------------------------------------------------------------

function NavItem({ item, isActive, collapsed, textColor, activeColor, theme, depth = 0 }: NavItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = 'children' in item && Array.isArray(item.children) && item.children.length > 0;
  const children: NavigationItem[] = (hasChildren && item.children) ? item.children as NavigationItem[] : [];
  const uniqueId = useId();
  const hoverClass = `nav-item-hover-${uniqueId.replace(/:/g, '')}`;
  const registry = getIconRegistry();
  
  // Try to get icons from registry
  const ChevronRightIcon = registry?.get('ChevronRight');
  const ChevronDownIcon = registry?.get('ChevronDown');

  const handleClick = (e: React.MouseEvent) => {
    if (hasChildren) {
      e.preventDefault();
      setIsExpanded(!isExpanded);
      navLog('Toggled section:', item.label, 'expanded:', !isExpanded);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (hasChildren) {
        setIsExpanded(!isExpanded);
      } else if (item.href) {
        window.location.href = item.href;
      }
    }
    if (e.key === 'ArrowRight' && hasChildren && !isExpanded) {
      setIsExpanded(true);
    }
    if (e.key === 'ArrowLeft' && hasChildren && isExpanded) {
      setIsExpanded(false);
    }
  };

  const paddingLeft = collapsed ? theme.spacing.sm : `calc(${theme.spacing.md} + ${depth * 16}px)`;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `.${hoverClass}:hover { background-color: rgba(255,255,255,0.08) !important; }`,
        }}
      />
      <a
        href={hasChildren ? undefined : item.href}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={hoverClass}
        tabIndex={0}
        role={hasChildren ? 'button' : 'link'}
        aria-current={isActive ? 'page' : undefined}
        aria-expanded={hasChildren ? isExpanded : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.xs,
          padding: `${theme.spacing.sm} ${paddingLeft}`,
          color: isActive ? activeColor : textColor,
          textDecoration: 'none',
          fontSize: '0.875rem',
          fontWeight: isActive ? 600 : 400,
          cursor: 'pointer',
          transition: 'background-color 0.2s, color 0.2s',
          backgroundColor: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
          borderLeft: isActive ? `3px solid ${activeColor}` : '3px solid transparent',
          whiteSpace: collapsed ? 'nowrap' : 'normal',
          overflow: collapsed ? 'hidden' : 'visible',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
        title={collapsed ? item.label : undefined}
      >
        {!collapsed && (
          <>
            <span style={{ flex: 1 }}>{item.label}</span>
            {hasChildren && (
              <span style={{ display: 'flex', alignItems: 'center' }}>
                {isExpanded ? (
                  ChevronDownIcon ? (
                    <ChevronDownIcon size={16} />
                  ) : (
                    '▼'
                  )
                ) : ChevronRightIcon ? (
                  <ChevronRightIcon size={16} />
                ) : (
                  '▶'
                )}
              </span>
            )}
          </>
        )}
        {collapsed && <span style={{ fontSize: '1.2rem' }}>•</span>}
      </a>
      {hasChildren && isExpanded && !collapsed && (
        <div role="group">
          {children.map((child: NavigationItem, idx: number) => (
            <NavItem
              key={idx}
              item={child}
              isActive={false}
              collapsed={false}
              textColor={textColor}
              activeColor={activeColor}
              theme={theme}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Collapse Toggle Button
// ---------------------------------------------------------------------------

interface CollapseToggleProps {
  collapsed: boolean;
  textColor: string;
  onToggle: () => void;
}

function CollapseToggle({ collapsed, textColor, onToggle }: CollapseToggleProps) {
  const uniqueId = useId();
  const hoverClass = `nav-toggle-${uniqueId.replace(/:/g, '')}`;
  const registry = getIconRegistry();
  const ChevronLeftIcon = registry?.get('ChevronLeft');
  const ChevronRightIcon = registry?.get('ChevronRight');

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `.${hoverClass}:hover { background-color: rgba(255,255,255,0.15) !important; }`,
        }}
      />
      <button
        className={hoverClass}
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: textColor,
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          transition: 'background-color 0.2s',
          width: '100%',
        }}
      >
        {collapsed ? (
          ChevronRightIcon ? (
            <ChevronRightIcon size={20} />
          ) : (
            '▶'
          )
        ) : ChevronLeftIcon ? (
          <ChevronLeftIcon size={20} />
        ) : (
          '◀'
        )}
      </button>
    </>
  );
}

// ---------------------------------------------------------------------------
// Main NavSidebar Component
// ---------------------------------------------------------------------------

export default function NavSidebar({
  navigationItems,
  collapsed: controlledCollapsed,
  width = 240,
  mobileBreakpoint = 768,
  backgroundColor,
  textColor,
  onCollapseToggle,
}: NavSidebarProps) {
  const theme = useSafeTheme();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const sidebarRef = useRef<HTMLElement>(null);

  const collapsed = controlledCollapsed ?? internalCollapsed;

  // Determine current path for active link detection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentPath(window.location.pathname);
      navLog('Current path:', window.location.pathname);
    }
  }, []);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < mobileBreakpoint;
      setIsMobile(mobile);
      navLog('Mobile check:', mobile, 'width:', window.innerWidth);
    };
    
    if (typeof window !== 'undefined') {
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, [mobileBreakpoint]);

  // Handle click outside on mobile
  useEffect(() => {
    if (!isMobile || !mobileOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
        navLog('Closed mobile drawer (click outside)');
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, mobileOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isMobile || !mobileOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        navLog('Closed mobile drawer (escape key)');
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobile, mobileOpen]);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobile && mobileOpen) {
      document.body.style.overflow = 'hidden';
      navLog('Body scroll locked');
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, mobileOpen]);

  const handleToggleCollapse = () => {
    const newCollapsed = !collapsed;
    setInternalCollapsed(newCollapsed);
    onCollapseToggle?.(newCollapsed);
    navLog('Toggled collapse:', newCollapsed);
  };

  // Theme colors
  const bgColor = backgroundColor
    ? resolveColor(backgroundColor, theme.colors)
    : theme.colors.surface || theme.colors.background;
  const textColorResolved = textColor
    ? resolveColor(textColor, theme.colors)
    : getBetterTextColor(theme.colors.text, theme.colors.textSecondary, bgColor);
  const activeColor = theme.colors.primary;

  const collapsedWidth = 48;
  const effectiveWidth = collapsed ? collapsedWidth : width;

  navLog('Render state:', {
    isMobile,
    mobileOpen,
    collapsed,
    effectiveWidth,
    itemCount: navigationItems.length,
  });

  // Check if a nav item is active
  const isItemActive = (item: NavigationItem) => {
    return item.href === currentPath;
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1199,
            transition: 'opacity 0.3s',
          }}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <nav
        ref={sidebarRef}
        role="navigation"
        aria-label="Main navigation"
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          height: '100vh',
          width: isMobile ? 280 : effectiveWidth,
          backgroundColor: bgColor,
          boxShadow: getThemeShadow(theme, 'md'),
          transition: 'width 0.3s ease, transform 0.3s ease',
          transform: isMobile ? (mobileOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
          zIndex: isMobile ? 1200 : 100,
          display: 'flex',
          flexDirection: 'column',
          overflowX: 'hidden',
          overflowY: 'auto',
        }}
      >
        {/* Collapse toggle button - desktop only */}
        {!isMobile && (
          <div
            style={{
              padding: theme.spacing.xs,
              borderBottom: `1px solid ${'divider' in theme.colors ? (theme.colors as any).divider : 'rgba(0,0,0,0.12)'}`,
            }}
          >
            <CollapseToggle
              collapsed={collapsed}
              textColor={textColorResolved}
              onToggle={handleToggleCollapse}
            />
          </div>
        )}

        {/* Navigation items */}
        <div
          style={{
            flex: 1,
            paddingTop: theme.spacing.sm,
            paddingBottom: theme.spacing.sm,
          }}
        >
          {navigationItems.map((item, index) => (
            <NavItem
              key={index}
              item={item}
              isActive={isItemActive(item)}
              collapsed={collapsed && !isMobile}
              textColor={textColorResolved}
              activeColor={activeColor}
              theme={theme}
            />
          ))}
        </div>
      </nav>

      {/* Mobile menu toggle button - shows when sidebar is closed */}
      {isMobile && !mobileOpen && (
        <button
          onClick={() => {
            setMobileOpen(true);
            navLog('Opened mobile drawer');
          }}
          aria-label="Open navigation menu"
          style={{
            position: 'fixed',
            bottom: 16,
            left: 16,
            zIndex: 1150,
            background: theme.colors.primary,
            color: getBetterTextColor(theme.colors.text, theme.colors.textSecondary, theme.colors.primary),
            border: 'none',
            borderRadius: '50%',
            width: 56,
            height: 56,
            cursor: 'pointer',
            boxShadow: getThemeShadow(theme, 'lg'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}
    </>
  );
}
