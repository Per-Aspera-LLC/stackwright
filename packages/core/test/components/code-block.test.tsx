import React from 'react';
import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CodeBlock } from '../../src/components/base/CodeBlock';
import { ensureHighlighter } from '../../src/utils/shikiHighlighter';
import { ThemeProvider } from '@stackwright/themes';
import type { Theme } from '@stackwright/themes';

// A minimal theme with a dark navy surface — luminance ≈ 0.023 (< 0.4 threshold).
// Mimics the stackwright-docs site: dark palette labelled as "light mode".
const darkSurfaceTheme: Theme = {
  id: 'dark-surface-test',
  name: 'Dark Surface Test',
  description: 'Test theme with dark surface for luminance-based Shiki theme selection',
  colors: {
    primary: '#FCC03E',
    secondary: '#4FC3F7',
    accent: '#F59E0B',
    background: '#0B1F3A',
    surface: '#1A2C46',
    text: '#FFFFFF',
    textSecondary: '#B0BEC5',
  },
  typography: {
    fontFamily: { primary: 'monospace', secondary: 'sans-serif' },
    scale: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
};

beforeAll(async () => {
  await ensureHighlighter();
}, 30000);

describe('CodeBlock', () => {
  it('renders plain code without a language', () => {
    render(<CodeBlock code="hello world" />);
    expect(screen.getByText('hello world')).toBeInTheDocument();
  });

  it('renders the language label when provided', () => {
    render(<CodeBlock code="x = 1" language="python" />);
    expect(screen.getByText('python')).toBeInTheDocument();
  });

  it('does not render a language label when omitted', () => {
    const { container } = render(<CodeBlock code="x = 1" />);
    // The label div should not exist — only the pre block
    const pre = container.querySelector('pre');
    expect(pre).toBeTruthy();
    // No sibling div before the pre (language label bar)
    expect(pre?.previousElementSibling).toBeNull();
  });

  it('renders line numbers when lineNumbers is true', () => {
    render(<CodeBlock code={'line one\nline two\nline three'} lineNumbers />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('does not render line numbers by default', () => {
    render(<CodeBlock code={'alpha\nbeta'} />);
    expect(screen.queryByText('1')).not.toBeInTheDocument();
    expect(screen.queryByText('2')).not.toBeInTheDocument();
  });

  it('produces colored spans for a known language', () => {
    const jsCode = 'const x = 42;';
    const { container } = render(<CodeBlock code={jsCode} language="javascript" />);
    const pre = container.querySelector('pre')!;
    // Shiki should produce spans with inline color styles for tokens
    const coloredSpans = pre.querySelectorAll('span[style*="color"]');
    expect(coloredSpans.length).toBeGreaterThan(0);
  });

  it('renders plain text for an unknown language without crashing', () => {
    const code = 'some random text';
    render(<CodeBlock code={code} language="brainfuck" />);
    expect(screen.getByText(code)).toBeInTheDocument();
    // Language label should still appear
    expect(screen.getByText('brainfuck')).toBeInTheDocument();
  });

  it('handles empty code string', () => {
    const { container } = render(<CodeBlock code="" />);
    const pre = container.querySelector('pre');
    expect(pre).toBeTruthy();
  });

  it('highlights TypeScript correctly via alias "ts"', () => {
    const tsCode = 'function greet(name: string): void {}';
    const { container } = render(<CodeBlock code={tsCode} language="ts" />);
    const pre = container.querySelector('pre')!;
    const coloredSpans = pre.querySelectorAll('span[style*="color"]');
    expect(coloredSpans.length).toBeGreaterThan(0);
  });

  it('highlights YAML content', () => {
    const yamlCode = 'key: value\nlist:\n  - item1';
    const { container } = render(<CodeBlock code={yamlCode} language="yaml" />);
    const pre = container.querySelector('pre')!;
    const coloredSpans = pre.querySelectorAll('span[style*="color"]');
    expect(coloredSpans.length).toBeGreaterThan(0);
  });

  it('highlights bash/shell content', () => {
    const bashCode = 'echo "hello" && cd /tmp';
    const { container } = render(<CodeBlock code={bashCode} language="bash" />);
    const pre = container.querySelector('pre')!;
    const coloredSpans = pre.querySelectorAll('span[style*="color"]');
    expect(coloredSpans.length).toBeGreaterThan(0);
  });

  it('renders highlighted tokens with dark-surface theme (uses dark Shiki theme)', () => {
    const jsCode = 'const x = 42;';
    const { container } = render(
      <ThemeProvider theme={darkSurfaceTheme} initialColorMode="light">
        <CodeBlock code={jsCode} language="javascript" />
      </ThemeProvider>
    );
    const pre = container.querySelector('pre')!;
    const coloredSpans = pre.querySelectorAll('span[style*="color"]');
    // github-dark (chosen via luminance < 0.4) should produce colored tokens
    expect(coloredSpans.length).toBeGreaterThan(0);
  });

  it('uses dark Shiki theme when surface luminance is below threshold regardless of colorMode', () => {
    const jsCode = 'const greeting = "hello";';
    const { container } = render(
      // initialColorMode="light" + dark surface → should still pick github-dark
      <ThemeProvider theme={darkSurfaceTheme} initialColorMode="light">
        <CodeBlock code={jsCode} language="javascript" />
      </ThemeProvider>
    );
    const pre = container.querySelector('pre')!;
    // github-dark produces light-coloured tokens — e.g. identifiers get #e6edf3 (very light).
    // github-light produces dark tokens — e.g. identifiers get #24292f (very dark).
    // jsdom normalises hex to rgb(), so we parse the channel values.
    const coloredSpans = Array.from(pre.querySelectorAll('span[style*="color"]')) as HTMLElement[];
    expect(coloredSpans.length).toBeGreaterThan(0);

    // Helper: extract average RGB channel from a css color string (hex or rgb()).
    function avgChannel(color: string): number {
      const rgb = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgb) return (Number(rgb[1]) + Number(rgb[2]) + Number(rgb[3])) / 3;
      const hex = color.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
      if (hex) return (parseInt(hex[1], 16) + parseInt(hex[2], 16) + parseInt(hex[3], 16)) / 3;
      return 0;
    }

    // At least one token must have avg channel > 150 (light colour from github-dark).
    // With github-light, plain identifiers render as #24292f (avg ≈ 41) — all dark.
    const hasLightToken = coloredSpans.some((s) => avgChannel(s.style.color) > 150);
    expect(hasLightToken).toBe(true);
  });
});
