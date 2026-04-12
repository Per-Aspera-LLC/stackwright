/**
 * Shared validation module for Stackwright content.
 *
 * Used by both CLI (page validate) and prebuild to ensure consistent
 * validation with AI-friendly error messages.
 */

import { z } from 'zod';
import { contentItemSchema, KNOWN_CONTENT_TYPE_KEYS, type GridColumn } from './content';
import { pageContentSchema } from './layout';
import { CONTENT_TYPE_HINTS, getContentTypeHints, suggestContentType } from './validation-hints';

// ============================================================================
// Types
// ============================================================================

/**
 * Structured validation error with semantic hints for AI agents.
 */
export interface ValidationError {
  /** Zod path as array */
  path: string[];
  /** Human-readable field path */
  fieldPath: string;
  /** The content type involved (if identifiable) */
  contentType?: string;
  /** Index in parent array (if applicable) */
  index?: number;
  /** What was expected */
  expected: string;
  /** What was actually provided */
  actual?: string;
  /** Actionable hint for fixing */
  hint: string;
  /** Did you mean suggestion (for typos) */
  suggestion?: string;
}

/**
 * Result of page content validation.
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Validation errors (empty if valid) */
  errors: ValidationError[];
  /** Human-readable summary */
  summary: string;
}

// ============================================================================
// Internal helpers
// ============================================================================

type ContentWalker = (item: Record<string, unknown>, path: string[]) => void;

/**
 * Walk all content items recursively, including nested items in grids and tabs.
 */
function walkContentItems(root: Record<string, unknown>, visitor: ContentWalker): void {
  const walkItems = (items: unknown[], parentPath: string[]): void => {
    if (!Array.isArray(items)) return;

    items.forEach((item, index) => {
      if (typeof item !== 'object' || item === null) return;
      const obj = item as Record<string, unknown>;
      const itemPath = [...parentPath, String(index)];

      // Visit the item
      visitor(obj, itemPath);

      // Recurse into grid columns
      if (obj.type === 'grid' && Array.isArray(obj.columns)) {
        for (let colIdx = 0; colIdx < (obj.columns as GridColumn[]).length; colIdx++) {
          const col = (obj.columns as GridColumn[])[colIdx];
          if (Array.isArray(col.content_items)) {
            walkItems(col.content_items, [...itemPath, 'columns', String(colIdx), 'content_items']);
          }
        }
      }

      // Recurse into tabbed content tabs
      if (obj.type === 'tabbed_content' && Array.isArray(obj.tabs)) {
        walkItems(obj.tabs, [...itemPath, 'tabs']);
      }
    });
  };

  const content = root?.content as Record<string, unknown> | undefined;
  if (!content) return;

  const items = content.content_items as unknown[] | undefined;
  if (!items) return;

  walkItems(items, ['content', 'content_items']);
}

/**
 * Detect content type from a content item.
 */
function detectContentType(item: Record<string, unknown>): string | undefined {
  const type = item?.type;
  if (typeof type === 'string' && KNOWN_CONTENT_TYPE_KEYS.includes(type as any)) {
    return type;
  }
  return undefined;
}

/**
 * Get field path string from path array.
 */
function formatFieldPath(path: string[]): string {
  return path.join('.');
}

/**
 * Get content type and field from a Zod error path.
 */
function extractContextFromPath(
  path: string[],
  root: Record<string, unknown>
): { contentType?: string; field?: string; index?: number } {
  // Try to find content type by walking the structure
  let foundType: string | undefined;
  walkContentItems(root, (item, itemPath) => {
    if (foundType) return;

    // Check if this path matches or is a prefix of the error path
    const matches = path.length >= itemPath.length && itemPath.every((seg, i) => path[i] === seg);

    if (matches) {
      foundType = detectContentType(item);
    }
  });

  return { contentType: foundType };
}

// Zod v4 issue types - use any to handle complex discriminated union
interface ZodIssueAny {
  code: string;
  path: (string | number)[];
  message: string;
  [key: string]: unknown;
}

/**
 * Create a hint from a Zod issue.
 */
function createHint(issue: z.ZodIssue, root: Record<string, unknown>): ValidationError {
  // Cast to any to handle Zod v4's complex discriminated union
  const issueAny = issue as unknown as ZodIssueAny;
  const path = issueAny.path.map(String);
  const fieldPath = formatFieldPath(path);

  // Extract context from path
  const context = extractContextFromPath(path, root);

  // Determine expected/actual
  let expected = 'valid value';
  let actual: string | undefined;
  let hint = 'Check the content type schema.';
  let suggestion: string | undefined;

  switch (issueAny.code) {
    case 'invalid_type': {
      const expectedType = String(issueAny.expected ?? 'unknown');
      const receivedType = String(issueAny.received ?? 'undefined');
      expected = `expected ${expectedType}, got ${receivedType}`;
      actual = receivedType;
      hint = `Expected ${expectedType} but received ${receivedType}.`;
      break;
    }

    case 'invalid_value': {
      // Zod v4 uses invalid_value instead of invalid_literal
      const options = issueAny.options as unknown[] | undefined;
      const received = String(issueAny.received ?? '');
      expected = options ? `one of: ${options.join(', ')}` : 'valid value';
      actual = received;
      hint = options ? `Invalid value. Expected one of: ${options.join(', ')}.` : 'Invalid value.';
      break;
    }

    case 'unrecognized_keys': {
      const keys = issueAny.keys as string[] | undefined;
      expected = 'valid keys only';
      hint = keys
        ? `Unrecognized keys: ${keys.join(', ')}. Remove them or check for typos.`
        : 'Unrecognized keys found. Remove them or check for typos.';
      break;
    }

    case 'invalid_union': {
      expected = 'valid content type';
      hint =
        'Invalid content type. Check that type is one of: ' + KNOWN_CONTENT_TYPE_KEYS.join(', ');

      // Zod v4: check received field for invalid type value
      const receivedValue = issueAny.received;
      if (typeof receivedValue === 'string') {
        const suggested = suggestContentType(receivedValue);
        if (suggested) {
          suggestion = suggested;
          hint = `Unknown content type "${receivedValue}". Did you mean "${suggested}"?`;
        }
      }
      break;
    }

    case 'too_small':
    case 'too_big': {
      // For size constraints
      const type = issueAny.type as string | undefined;
      hint =
        issueAny.code === 'too_small'
          ? `Value is too small${type ? ` (expected ${type})` : ''}.`
          : `Value is too large${type ? ` (expected ${type})` : ''}.`;
      expected = type ?? 'valid size';
      break;
    }

    case 'custom':
    default:
      expected = issueAny.message;
      hint = issueAny.message;
  }

  // Enhance hint with content-type-specific guidance
  if (context.contentType) {
    const typeHints = getContentTypeHints(context.contentType);
    if (typeHints) {
      // Find the specific field that failed
      const failedField = path[path.length - 1];
      const fieldHint = typeHints.fields.find((f) => f.field === failedField);

      if (fieldHint) {
        expected = fieldHint.expected;
        hint = fieldHint.hint;
      } else if (failedField && failedField !== 'type') {
        // Generic hint for the content type
        hint = `${typeHints.description}. Check that all required fields are present.`;
      }
    }
  }

  return {
    path,
    fieldPath,
    contentType: context.contentType,
    index: context.index,
    expected,
    actual,
    hint,
    suggestion,
  };
}

/**
 * Check for unknown content type keys in content items.
 */
function checkUnknownContentTypes(root: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];

  walkContentItems(root, (item, path) => {
    const type = item?.type;

    if (!type) {
      errors.push({
        path,
        fieldPath: formatFieldPath([...path, 'type']),
        expected: 'type field (e.g., main, grid, text_block)',
        hint: 'Each content item must have a "type" field specifying the content type.',
      });
      return;
    }

    if (typeof type !== 'string') {
      errors.push({
        path,
        fieldPath: formatFieldPath([...path, 'type']),
        expected: 'string',
        actual: typeof type,
        hint: 'The type field must be a string.',
      });
      return;
    }

    if (!KNOWN_CONTENT_TYPE_KEYS.includes(type as any)) {
      const suggested = suggestContentType(type);
      errors.push({
        path,
        fieldPath: formatFieldPath([...path, 'type']),
        contentType: type,
        expected: 'valid content type',
        actual: type,
        hint: suggested
          ? `Unknown content type "${type}". Did you mean "${suggested}"?`
          : `Unknown content type "${type}". Valid types: ${KNOWN_CONTENT_TYPE_KEYS.join(', ')}.`,
        suggestion: suggested ?? undefined,
      });
    }
  });

  return errors;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Validate page content YAML against the schema.
 * Returns structured validation result with AI-friendly errors.
 */
export function validatePageContent(yamlContent: unknown): ValidationResult {
  // First pass: Zod schema validation
  const result = pageContentSchema.safeParse(yamlContent);

  const errors: ValidationError[] = [];

  if (!result.success) {
    // Root must be the original content for path navigation
    const root = yamlContent as Record<string, unknown>;

    // Convert Zod issues to structured errors
    for (const issue of result.error.issues) {
      errors.push(createHint(issue, root));
    }
  }

  // Second pass: check for unknown content types (catches typos before Zod strips them)
  if (typeof yamlContent === 'object' && yamlContent !== null) {
    const unknownTypeErrors = checkUnknownContentTypes(yamlContent as Record<string, unknown>);
    errors.push(...unknownTypeErrors);
  }

  // Deduplicate errors (Zod and unknown type check may produce duplicates)
  const seen = new Set<string>();
  const dedupedErrors = errors.filter((err) => {
    const key = `${err.fieldPath}:${err.hint}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Generate summary
  const summary =
    dedupedErrors.length === 0
      ? 'Valid'
      : `${dedupedErrors.length} validation error${dedupedErrors.length > 1 ? 's' : ''} found`;

  return {
    valid: dedupedErrors.length === 0,
    errors: dedupedErrors,
    summary,
  };
}

/**
 * Validate a single content item.
 */
export function validateContentItem(item: unknown): ValidationResult {
  const result = contentItemSchema.safeParse(item);

  const errors: ValidationError[] = [];

  if (!result.success) {
    const root = item as Record<string, unknown>;
    for (const issue of result.error.issues) {
      errors.push(createHint(issue, root));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    summary: errors.length === 0 ? 'Valid' : `${errors.length} error(s)`,
  };
}

/**
 * Format validation errors for CLI output.
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return '✓ All pages are valid.';

  const lines: string[] = [];

  for (const err of errors) {
    const location = err.fieldPath;
    const suggestion = err.suggestion ? ` (did you mean "${err.suggestion}"?)` : '';

    lines.push(`  ✗ ${location}${suggestion}`);
    lines.push(`     ${err.hint}`);
    if (err.expected) {
      lines.push(`     Expected: ${err.expected}`);
    }
  }

  return lines.join('\n');
}

/**
 * Format validation errors as JSON for agent consumption.
 */
export interface ValidationResultJson {
  valid: boolean;
  errorCount: number;
  errors: Array<{
    path: string[];
    field: string;
    contentType?: string;
    expected: string;
    actual?: string;
    hint: string;
    suggestion?: string;
  }>;
}

export function toJsonFormat(result: ValidationResult): ValidationResultJson {
  return {
    valid: result.valid,
    errorCount: result.errors.length,
    errors: result.errors.map((err) => ({
      path: err.path,
      field: err.fieldPath,
      contentType: err.contentType,
      expected: err.expected,
      actual: err.actual,
      hint: err.hint,
      suggestion: err.suggestion,
    })),
  };
}
