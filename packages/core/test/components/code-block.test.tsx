import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CodeBlock } from '../../src/components/base/CodeBlock';

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
    // Prism should produce spans with inline color styles for tokens
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
});
