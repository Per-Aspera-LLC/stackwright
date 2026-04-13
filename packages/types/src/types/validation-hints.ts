/**
 * Validation hint database for Stackwright content types.
 *
 * Maps content types to their required/optional fields with hints.
 * Used by the validation module to produce AI-friendly error messages.
 */

export interface FieldHint {
  field: string;
  required: boolean;
  description: string;
  expected: string;
  hint: string;
}

export interface ContentTypeHints {
  type: string;
  description: string;
  fields: FieldHint[];
}

/**
 * Hint database for built-in content types.
 * These hints are used when validation fails to provide actionable feedback.
 */
export const CONTENT_TYPE_HINTS: Record<string, ContentTypeHints> = {
  main: {
    type: 'main',
    description: 'Hero/main content section with heading and body text',
    fields: [
      {
        field: 'heading',
        required: true,
        description: 'Page heading',
        expected: '{ text: string, textSize: h1|h2|h3|h4|h5|h6 }',
        hint: 'Use a heading object with text (the heading text) and textSize (h1-h6)',
      },
      {
        field: 'textBlocks',
        required: true,
        description: 'Body content paragraphs',
        expected: 'array of { text: string, textSize: body1|body2|subtitle1|subtitle2 }',
        hint: 'Wrap body text in a textBlocks array. Each item needs text and textSize.',
      },
      {
        field: 'media',
        required: false,
        description: 'Optional image or video',
        expected: '{ type: "image"|"video"|"media"|"icon", src: string, ... }',
        hint: 'Add an image or video with type and src fields',
      },
      {
        field: 'buttons',
        required: false,
        description: 'Call-to-action buttons',
        expected:
          'array of { text: string, href?: string, variant?: "text"|"outlined"|"contained" }',
        hint: 'Add buttons with text and optional href and variant',
      },
    ],
  },

  grid: {
    type: 'grid',
    description: 'Multi-column grid layout',
    fields: [
      {
        field: 'label',
        required: true,
        description: 'Unique identifier',
        expected: 'string (kebab-case recommended)',
        hint: 'Add a unique label to identify this grid section',
      },
      {
        field: 'columns',
        required: true,
        description: 'Grid columns',
        expected: 'array of { content_items: ContentItem[], width?: number }',
        hint: 'Each column needs a content_items array containing valid content blocks',
      },
      {
        field: 'heading',
        required: false,
        description: 'Optional section heading',
        expected: '{ text: string, textSize: h1|h2|h3|h4|h5|h6 }',
        hint: 'Add a heading object with text and textSize',
      },
    ],
  },

  tabbed_content: {
    type: 'tabbed_content',
    description: 'Tabbed content sections',
    fields: [
      {
        field: 'label',
        required: true,
        description: 'Unique identifier',
        expected: 'string (kebab-case recommended)',
        hint: 'Add a unique label to identify this tabbed section',
      },
      {
        field: 'heading',
        required: true,
        description: 'Section heading',
        expected: '{ text: string, textSize: h1|h2|h3|h4|h5|h6 }',
        hint: 'Use a heading object with text and textSize',
      },
      {
        field: 'tabs',
        required: true,
        description: 'Tab content items',
        expected: 'array of ContentItem (any valid content type)',
        hint: 'Each tab should be a valid content item like main, text_block, media, etc.',
      },
    ],
  },

  text_block: {
    type: 'text_block',
    description: 'Rich text section with heading and body',
    fields: [
      {
        field: 'label',
        required: true,
        description: 'Unique identifier',
        expected: 'string (kebab-case recommended)',
        hint: 'Add a unique label to identify this text block',
      },
      {
        field: 'textBlocks',
        required: true,
        description: 'Text content',
        expected: 'array of { text: string, textSize: body1|body2|subtitle1|subtitle2 }',
        hint: 'Wrap text in a textBlocks array with text and textSize fields',
      },
      {
        field: 'heading',
        required: false,
        description: 'Optional heading',
        expected: '{ text: string, textSize: h1|h2|h3|h4|h5|h6 }',
        hint: 'Add a heading object with text and textSize',
      },
    ],
  },

  carousel: {
    type: 'carousel',
    description: 'Sliding image carousel',
    fields: [
      {
        field: 'label',
        required: true,
        description: 'Unique identifier',
        expected: 'string',
        hint: 'Add a unique label for this carousel',
      },
      {
        field: 'heading',
        required: true,
        description: 'Carousel title',
        expected: 'string',
        hint: 'Add a heading string for the carousel title',
      },
      {
        field: 'items',
        required: true,
        description: 'Carousel slides',
        expected: 'array of { title: string, text: string, media: MediaItem }',
        hint: 'Each slide needs title, text, and a media item (image/video)',
      },
    ],
  },

  feature_list: {
    type: 'feature_list',
    description: 'Feature grid with icons',
    fields: [
      {
        field: 'label',
        required: true,
        description: 'Unique identifier',
        expected: 'string',
        hint: 'Add a unique label for this feature list',
      },
      {
        field: 'items',
        required: true,
        description: 'Feature items',
        expected: 'array of { heading: string, description: string, icon?: MediaItem }',
        hint: 'Each feature needs a heading and description. Optionally add an icon.',
      },
    ],
  },

  faq: {
    type: 'faq',
    description: 'Frequently asked questions',
    fields: [
      {
        field: 'label',
        required: true,
        description: 'Unique identifier',
        expected: 'string',
        hint: 'Add a unique label for this FAQ section',
      },
      {
        field: 'items',
        required: true,
        description: 'FAQ question-answer pairs',
        expected: 'array of { question: string, answer: string }',
        hint: 'Each FAQ item needs a question and answer',
      },
    ],
  },

  pricing_table: {
    type: 'pricing_table',
    description: 'Pricing plan comparison',
    fields: [
      {
        field: 'label',
        required: true,
        description: 'Unique identifier',
        expected: 'string',
        hint: 'Add a unique label for this pricing table',
      },
      {
        field: 'plans',
        required: true,
        description: 'Pricing plans',
        expected:
          'array of { name: string, price: string, features: string[], cta_text: string, cta_href: string }',
        hint: 'Each plan needs name, price, features list, and CTA button',
      },
    ],
  },

  alert: {
    type: 'alert',
    description: 'Callout/notice box',
    fields: [
      {
        field: 'label',
        required: true,
        description: 'Unique identifier',
        expected: 'string',
        hint: 'Add a unique label for this alert',
      },
      {
        field: 'variant',
        required: true,
        description: 'Alert style',
        expected: 'info|warning|success|danger|note|tip',
        hint: 'Choose a variant: info (blue), warning (yellow), success (green), danger (red), note (gray), tip (lightbulb)',
      },
      {
        field: 'body',
        required: true,
        description: 'Alert message',
        expected: 'string',
        hint: 'Add the alert message text',
      },
    ],
  },

  contact_form_stub: {
    type: 'contact_form_stub',
    description: 'Contact form placeholder',
    fields: [
      {
        field: 'label',
        required: true,
        description: 'Unique identifier',
        expected: 'string',
        hint: 'Add a unique label for this contact form',
      },
      {
        field: 'email',
        required: true,
        description: 'Contact email',
        expected: 'string (email address)',
        hint: 'Add the email address where form submissions should be sent',
      },
    ],
  },

  code_block: {
    type: 'code_block',
    description: 'Code snippet display',
    fields: [
      {
        field: 'label',
        required: true,
        description: 'Unique identifier',
        expected: 'string',
        hint: 'Add a unique label for this code block',
      },
      {
        field: 'code',
        required: true,
        description: 'Code content',
        expected: 'string',
        hint: 'Add the code to display',
      },
      {
        field: 'language',
        required: false,
        description: 'Programming language',
        expected: 'javascript|typescript|python|bash|yaml|json|html|css|...',
        hint: 'Specify the language for syntax highlighting',
      },
    ],
  },

  timeline: {
    type: 'timeline',
    description: 'Timeline/changelog display',
    fields: [
      {
        field: 'label',
        required: true,
        description: 'Unique identifier',
        expected: 'string',
        hint: 'Add a unique label for this timeline',
      },
      {
        field: 'items',
        required: true,
        description: 'Timeline events',
        expected: 'array of { year: string, event: string }',
        hint: 'Each timeline item needs a year and event description',
      },
    ],
  },

  icon_grid: {
    type: 'icon_grid',
    description: 'Grid of icons with labels',
    fields: [
      {
        field: 'label',
        required: true,
        description: 'Unique identifier',
        expected: 'string',
        hint: 'Add a unique label for this icon grid',
      },
      {
        field: 'icons',
        required: true,
        description: 'Icon items',
        expected:
          'array of IconContent ({ type: "icon", src: string, label: string, size?: number })',
        hint: 'Each icon needs type="icon", src (icon name), and label',
      },
    ],
  },

  testimonial_grid: {
    type: 'testimonial_grid',
    description: 'Customer testimonial cards',
    fields: [
      {
        field: 'label',
        required: true,
        description: 'Unique identifier',
        expected: 'string',
        hint: 'Add a unique label for this testimonial grid',
      },
      {
        field: 'items',
        required: true,
        description: 'Testimonials',
        expected: 'array of { quote: string, name: string, role?: string, company?: string }',
        hint: 'Each testimonial needs a quote and name. Optionally add role and company.',
      },
    ],
  },

  media: {
    type: 'media',
    description: 'Single media display (image/video)',
    fields: [
      {
        field: 'label',
        required: true,
        description: 'Unique identifier',
        expected: 'string',
        hint: 'Add a unique label for this media',
      },
      {
        field: 'src',
        required: true,
        description: 'Media source',
        expected: 'string (URL or path)',
        hint: 'Add the image or video URL/path',
      },
    ],
  },

  video: {
    type: 'video',
    description: 'Video player',
    fields: [
      {
        field: 'label',
        required: true,
        description: 'Unique identifier',
        expected: 'string',
        hint: 'Add a unique label for this video',
      },
      {
        field: 'src',
        required: true,
        description: 'Video source',
        expected: 'string (URL)',
        hint: 'Add the video URL',
      },
    ],
  },

  collection_list: {
    type: 'collection_list',
    description: 'Dynamic content from a collection',
    fields: [
      {
        field: 'label',
        required: true,
        description: 'Unique identifier',
        expected: 'string',
        hint: 'Add a unique label for this collection list',
      },
      {
        field: 'source',
        required: true,
        description: 'Collection name',
        expected: 'string (defined in stackwright.yml collections)',
        hint: 'Specify which collection to display (must be defined in stackwright.yml)',
      },
    ],
  },

  map: {
    type: 'map',
    description: 'Interactive map',
    fields: [
      {
        field: 'label',
        required: true,
        description: 'Unique identifier',
        expected: 'string',
        hint: 'Add a unique label for this map',
      },
      {
        field: 'center',
        required: true,
        description: 'Map center coordinates',
        expected: '{ lat: number, lng: number }',
        hint: 'Specify latitude and longitude for map center',
      },
      {
        field: 'zoom',
        required: true,
        description: 'Zoom level',
        expected: 'number (0-20)',
        hint: 'Add zoom level between 0 (world) and 20 (street)',
      },
    ],
  },
};

/**
 * Get hints for a specific content type.
 */
export function getContentTypeHints(type: string): ContentTypeHints | undefined {
  return CONTENT_TYPE_HINTS[type];
}

/**
 * Check if a type string looks like a typo of a known content type.
 * Returns the closest match if similarity > 0.6, otherwise null.
 */
export function suggestContentType(typo: string): string | null {
  const knownTypes = Object.keys(CONTENT_TYPE_HINTS);
  const lowerTypo = typo.toLowerCase();

  // Exact match (case insensitive)
  const exactMatch = knownTypes.find((t) => t.toLowerCase() === lowerTypo);
  if (exactMatch) return null; // Not a typo if exact match exists

  // Find closest match using simple edit distance
  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const known of knownTypes) {
    const score = similarity(typo, known);
    if (score > 0.6 && score > bestScore) {
      bestScore = score;
      bestMatch = known;
    }
  }

  return bestMatch;
}

/**
 * Simple similarity score between two strings (0-1).
 * Uses Levenshtein distance relative to max length.
 */
function similarity(a: string, b: string): number {
  const lenA = a.length;
  const lenB = b.length;

  // Quick reject for very different lengths
  if (Math.abs(lenA - lenB) > Math.max(lenA, lenB) * 0.5) {
    return 0;
  }

  // Create edit distance matrix
  const matrix: number[][] = [];
  for (let i = 0; i <= lenA; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= lenB; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      const cost = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[lenA][lenB];
  const maxLen = Math.max(lenA, lenB);
  return maxLen > 0 ? 1 - distance / maxLen : 0;
}
