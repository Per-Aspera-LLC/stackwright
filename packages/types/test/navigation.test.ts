import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  navigationLinkSchema,
  navigationSectionSchema,
  navigationItemSchema,
  isNavigationSection,
  isNavigationLink,
} from '../src/types/navigation';
import type { NavigationItem, NavigationLink, NavigationSection } from '../src/types/navigation';

describe('navigationLinkSchema', () => {
  it('accepts { label, href }', () => {
    const result = navigationLinkSchema.safeParse({ label: 'Home', href: '/' });
    expect(result.success).toBe(true);
  });

  it('accepts { label, href, children: [...] } (recursive)', () => {
    const result = navigationLinkSchema.safeParse({
      label: 'Products',
      href: '/products',
      children: [
        { label: 'Widgets', href: '/products/widgets' },
        {
          label: 'Gadgets',
          href: '/products/gadgets',
          children: [{ label: 'Gizmos', href: '/products/gadgets/gizmos' }],
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.children).toHaveLength(2);
      expect(result.data.children![1].children).toHaveLength(1);
    }
  });

  it('rejects missing label', () => {
    const result = navigationLinkSchema.safeParse({ href: '/about' });
    expect(result.success).toBe(false);
  });

  it('rejects missing href', () => {
    const result = navigationLinkSchema.safeParse({ label: 'About' });
    expect(result.success).toBe(false);
  });
});

describe('navigationSectionSchema', () => {
  it('accepts { section: "Maps", items: [{ label, href }] }', () => {
    const result = navigationSectionSchema.safeParse({
      section: 'Maps',
      items: [{ label: 'Operations Map', href: '/operations-map' }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.section).toBe('Maps');
      expect(result.data.items).toHaveLength(1);
    }
  });

  it('accepts section with multiple items', () => {
    const result = navigationSectionSchema.safeParse({
      section: 'Reports',
      items: [
        { label: 'Daily', href: '/reports/daily' },
        { label: 'Weekly', href: '/reports/weekly' },
        { label: 'Monthly', href: '/reports/monthly' },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toHaveLength(3);
    }
  });

  it('accepts section with items that have children', () => {
    const result = navigationSectionSchema.safeParse({
      section: 'Admin',
      items: [
        {
          label: 'Users',
          href: '/admin/users',
          children: [
            { label: 'Active', href: '/admin/users/active' },
            { label: 'Pending', href: '/admin/users/pending' },
          ],
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items[0].children).toHaveLength(2);
    }
  });

  it('rejects empty items array (min 1)', () => {
    const result = navigationSectionSchema.safeParse({
      section: 'Empty Section',
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing section string', () => {
    const result = navigationSectionSchema.safeParse({
      items: [{ label: 'Home', href: '/' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing items array', () => {
    const result = navigationSectionSchema.safeParse({
      section: 'Orphaned Section',
    });
    expect(result.success).toBe(false);
  });

  it('section with empty string is technically valid (z.string() allows it)', () => {
    // z.string() has no .min(1) — blank section titles ARE structurally valid.
    // This documents the current behavior so we notice if it ever changes.
    const result = navigationSectionSchema.safeParse({
      section: '',
      items: [{ label: 'Home', href: '/' }],
    });
    expect(result.success).toBe(true);
  });
});

describe('navigationItemSchema (union)', () => {
  it('accepts a plain link { label, href }', () => {
    const result = navigationItemSchema.safeParse({ label: 'Dashboard', href: '/dashboard' });
    expect(result.success).toBe(true);
  });

  it('accepts a section { section, items }', () => {
    const result = navigationItemSchema.safeParse({
      section: 'Maps',
      items: [{ label: 'Operations Map', href: '/operations-map' }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts mixed array of links and sections', () => {
    const nav: NavigationItem[] = [
      { label: 'Home', href: '/' },
      { section: 'Tools', items: [{ label: 'Editor', href: '/editor' }] },
      { label: 'About', href: '/about' },
    ];
    const result = z.array(navigationItemSchema).safeParse(nav);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(3);
    }
  });

  it('rejects object with neither label/href nor section/items', () => {
    const result = navigationItemSchema.safeParse({ foo: 'bar' });
    expect(result.success).toBe(false);
  });

  it('rejects { section: "foo" } without items (partial section)', () => {
    const result = navigationItemSchema.safeParse({ section: 'Incomplete' });
    expect(result.success).toBe(false);
  });

  it('parses the canonical YAML shape from the requirements correctly', () => {
    const canonicalNav = [
      { label: 'Home', href: '/' },
      { label: 'Dashboard', href: '/dashboard' },
      {
        section: 'Maps',
        items: [
          { label: 'Operations Map', href: '/operations-map' },
          { label: 'Movement Tracker', href: '/movement-tracker' },
        ],
      },
    ];
    const result = z.array(navigationItemSchema).safeParse(canonicalNav);
    expect(result.success).toBe(true);
    if (result.success) {
      const [home, dashboard, mapsSection] = result.data;
      expect(isNavigationLink(home)).toBe(true);
      expect(isNavigationLink(dashboard)).toBe(true);
      expect(isNavigationSection(mapsSection)).toBe(true);
      if (isNavigationSection(mapsSection)) {
        expect(mapsSection.section).toBe('Maps');
        expect(mapsSection.items).toHaveLength(2);
        expect(mapsSection.items[0].label).toBe('Operations Map');
        expect(mapsSection.items[1].href).toBe('/movement-tracker');
      }
    }
  });
});

describe('type guards', () => {
  const linkItem: NavigationItem = { label: 'Home', href: '/' };
  const sectionItem: NavigationItem = {
    section: 'Tools',
    items: [{ label: 'Editor', href: '/editor' }],
  };

  it('isNavigationSection returns true for section objects', () => {
    expect(isNavigationSection(sectionItem)).toBe(true);
  });

  it('isNavigationSection returns false for link objects', () => {
    expect(isNavigationSection(linkItem)).toBe(false);
  });

  it('isNavigationLink returns true for link objects', () => {
    expect(isNavigationLink(linkItem)).toBe(true);
  });

  it('isNavigationLink returns false for section objects', () => {
    expect(isNavigationLink(sectionItem)).toBe(false);
  });

  it('type guards narrow correctly in a loop', () => {
    const items: NavigationItem[] = [linkItem, sectionItem, linkItem];
    const links: NavigationLink[] = [];
    const sections: NavigationSection[] = [];

    for (const item of items) {
      if (isNavigationLink(item)) {
        links.push(item);
      } else if (isNavigationSection(item)) {
        sections.push(item);
      }
    }

    expect(links).toHaveLength(2);
    expect(sections).toHaveLength(1);
    // TypeScript should be happy with these property accesses (type narrowing works)
    expect(links[0].label).toBe('Home');
    expect(sections[0].section).toBe('Tools');
  });
});

describe('backward compatibility', () => {
  it('existing navigation arrays with only links parse unchanged', () => {
    const legacyNav = [
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ];
    const result = z.array(navigationItemSchema).safeParse(legacyNav);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(3);
      // Parsed data shape should be identical to input
      expect(result.data[0]).toEqual({ label: 'Home', href: '/' });
    }
  });

  it('z.array(navigationItemSchema) parses array of just links', () => {
    const result = z.array(navigationItemSchema).safeParse([{ label: 'Docs', href: '/docs' }]);
    expect(result.success).toBe(true);
  });

  it('z.array(navigationItemSchema) parses empty array', () => {
    const result = z.array(navigationItemSchema).safeParse([]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(0);
    }
  });

  it('links with children still work after the union refactor', () => {
    const result = z.array(navigationItemSchema).safeParse([
      {
        label: 'Products',
        href: '/products',
        children: [
          { label: 'Category A', href: '/products/a' },
          { label: 'Category B', href: '/products/b' },
        ],
      },
    ]);
    expect(result.success).toBe(true);
    if (result.success) {
      const item = result.data[0];
      expect(isNavigationLink(item)).toBe(true);
      if (isNavigationLink(item)) {
        expect(item.children).toHaveLength(2);
      }
    }
  });
});
