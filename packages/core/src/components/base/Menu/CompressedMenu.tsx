import React, { useRef, useEffect } from 'react';

interface CompressedMenuProps<T = unknown> {
  menuItems: T[];
  menuOpen: boolean;
  anchorEl: HTMLElement | null;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
  onMenuClose: () => void;
  buildMenu: (items: T[], compressed: boolean) => React.ReactNode;
}

export function CompressedMenu<T>({
  menuItems,
  menuOpen,
  anchorEl,
  onMenuOpen,
  onMenuClose,
  buildMenu
}: CompressedMenuProps<T>) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onMenuClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen, onMenuClose]);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={onMenuOpen}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          color: 'var(--sw-color-primary, currentColor)',
        }}
        aria-label="Menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      {menuOpen && (
        <div
          ref={menuRef}
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            width: 'auto',
            maxWidth: '200px',
            backgroundColor: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            borderRadius: '4px',
            zIndex: 1000,
            padding: '8px',
          }}
        >
          {buildMenu(menuItems, true)}
        </div>
      )}
    </div>
  );
}
