import React from 'react';

interface JsonLdScriptProps {
  /** Array of JSON-LD objects to render as <script type="application/ld+json"> tags. */
  data: Record<string, unknown>[];
}

/**
 * Renders one or more `<script type="application/ld+json">` tags for SEO
 * structured data.
 *
 * Sanitizes the JSON to prevent XSS via `</script>` injection.
 * Renders nothing when the data array is empty.
 */
export function JsonLdScript({ data }: JsonLdScriptProps) {
  if (data.length === 0) return null;

  return (
    <>
      {data.map((item, index) => (
        <script
          key={`jsonld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item).replace(/<\/script>/gi, '<\\/script>'),
          }}
        />
      ))}
    </>
  );
}
