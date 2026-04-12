import { describe, it, expect } from 'vitest';
import { validatePageContent, formatValidationErrors } from '../src/types/validation';
import { suggestContentType } from '../src/types/validation-hints';

describe('validatePageContent', () => {
  it('passes valid main content', () => {
    const valid = {
      content: {
        content_items: [
          {
            type: 'main',
            label: 'hero',
            heading: { text: 'Hello', textSize: 'h1' },
            textBlocks: [{ text: 'Body', textSize: 'body1' }],
          },
        ],
      },
    };
    const result = validatePageContent(valid);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails main missing heading with hint', () => {
    const invalid = {
      content: {
        content_items: [
          {
            type: 'main',
            label: 'hero',
            // missing heading
            textBlocks: [{ text: 'Body', textSize: 'body1' }],
          },
        ],
      },
    };
    const result = validatePageContent(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    // Should have a hint
    expect(result.errors[0].hint).toBeTruthy();
  });

  it('catches typo in content type with suggestion', () => {
    const invalid = {
      content: {
        content_items: [
          {
            type: 'feture_list', // typo!
            label: 'features',
          },
        ],
      },
    };
    const result = validatePageContent(invalid);
    expect(result.valid).toBe(false);
    const typoError = result.errors.find((e) => e.suggestion === 'feature_list');
    expect(typoError).toBeDefined();
    expect(typoError?.suggestion).toBe('feature_list');
  });

  it('validates nested grid column content_items', () => {
    const invalid = {
      content: {
        content_items: [
          {
            type: 'grid',
            label: 'features',
            columns: [
              {
                content_items: [
                  { type: 'typo_type' }, // invalid nested type
                ],
              },
            ],
          },
        ],
      },
    };
    const result = validatePageContent(invalid);
    expect(result.valid).toBe(false);
    // Should find the nested error
    expect(result.errors.some((e) => e.fieldPath.includes('columns'))).toBe(true);
  });

  it('passes valid alert with all required fields', () => {
    const valid = {
      content: {
        content_items: [
          {
            type: 'alert',
            label: 'notice',
            variant: 'info',
            body: 'This is a notice',
          },
        ],
      },
    };
    const result = validatePageContent(valid);
    expect(result.valid).toBe(true);
  });

  it('fails alert missing required fields', () => {
    const invalid = {
      content: {
        content_items: [
          {
            type: 'alert',
            label: 'notice',
            // missing variant and body
          },
        ],
      },
    };
    const result = validatePageContent(invalid);
    expect(result.valid).toBe(false);
  });
});

describe('suggestContentType', () => {
  it('returns null for exact match', () => {
    expect(suggestContentType('main')).toBeNull();
    expect(suggestContentType('feature_list')).toBeNull();
  });

  it('returns null for case-exact match', () => {
    expect(suggestContentType('Main')).toBeNull();
    expect(suggestContentType('FEATURE_LIST')).toBeNull();
  });

  it('suggests feature_list for feture_list typo', () => {
    expect(suggestContentType('feture_list')).toBe('feature_list');
    expect(suggestContentType('fetaure_list')).toBe('feature_list');
  });

  it('suggests text_block for textblock typo', () => {
    expect(suggestContentType('textblock')).toBe('text_block');
    expect(suggestContentType('text-block')).toBe('text_block');
  });

  it('returns null for completely different string', () => {
    expect(suggestContentType('xyz123')).toBeNull();
    expect(suggestContentType('foobar')).toBeNull();
  });
});

describe('formatValidationErrors', () => {
  it('returns success message for no errors', () => {
    const output = formatValidationErrors([]);
    expect(output).toBe('✓ All pages are valid.');
  });

  it('formats errors with suggestions', () => {
    const errors = [
      {
        path: ['content', 'content_items', '0', 'type'],
        fieldPath: 'content.content_items.0.type',
        expected: 'valid content type',
        actual: 'feture_list',
        hint: 'Unknown content type "feture_list". Did you mean "feature_list"?',
        suggestion: 'feature_list',
      },
    ];
    const output = formatValidationErrors(errors);
    expect(output).toContain('did you mean "feature_list"');
    expect(output).toContain('Unknown content type');
  });
});
