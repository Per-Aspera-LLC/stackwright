import { ComponentType } from 'react';
import type { ZodSchema } from './zod-compat';
import { registerComponent, deregisterComponent } from './componentRegistry';

export interface ContentTypeEntry {
  key: string;
  schema: ZodSchema;
  component: ComponentType<any>;
}

// Registry of custom content types contributed by consumers.
// Built-in types are NOT stored here — they live in componentRegistry.ts.
const customContentTypes = new Map<string, ContentTypeEntry>();

/**
 * Register a custom content type.
 *
 * Call this in `_app.tsx` (or `layout.tsx`) before first render:
 *
 * ```ts
 * import { registerContentType } from '@stackwright/core';
 * import { z } from 'zod';
 *
 * registerContentType('my_widget', z.object({ label: z.string(), text: z.string() }), MyWidget);
 * ```
 *
 * The YAML key, Zod schema, and React component are stored together.
 * The component is also added to the shared componentRegistry so that
 * `renderContentItem` can resolve it by key.
 */
export function registerContentType(
  key: string,
  schema: ZodSchema,
  component: ComponentType<any>
): void {
  customContentTypes.set(key, { key, schema, component });
  // Also register in the component registry so contentRenderer can find it.
  registerComponent(key, component);
}

/**
 * Return all registered custom content types.
 * Useful for MCP tools and schema introspection.
 */
export function getRegisteredContentTypes(): ContentTypeEntry[] {
  return Array.from(customContentTypes.values());
}

/**
 * Return the Zod schema for a specific custom content type key, or undefined
 * if the key is not a registered custom type.
 */
export function getContentTypeSchema(key: string): ZodSchema | undefined {
  return customContentTypes.get(key)?.schema;
}

/** Clear all custom registrations. Intended for use in tests only. */
export function clearContentTypeRegistry(): void {
  for (const key of customContentTypes.keys()) {
    deregisterComponent(key);
  }
  customContentTypes.clear();
}
