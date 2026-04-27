import { ContentItem, PageContent } from '@stackwright/types';
import { TopAppBar, BottomAppBar } from '../components/structural/';
import { StackwrightConfig } from '../config/defaults';
import { getComponentByType } from './componentRegistry';
import { getContentTypeSchema } from './contentTypeRegistry';
import { UnknownContentType } from '../components/base/UnknownContentType';
import { ContentItemErrorBoundary } from '../components/ContentItemErrorBoundary';

// Debug logging utility — only logs when STACKWRIGHT_DEBUG is enabled in development
const debugLog = (message: string, data?: unknown) => {
  if (process.env.NODE_ENV === 'development' && process.env.STACKWRIGHT_DEBUG === 'true') {
    console.log(`🐛 ContentRenderer: ${message}`, data ?? '');
  }
};

// Type guard to check if content is PageContent
function isPageContent(content: PageContent | ContentItem): content is PageContent {
  return (
    content != null &&
    'content' in content &&
    typeof content.content === 'object' &&
    content.content !== null
  );
}

export interface RenderContentOptions {
  key?: string;
  /**
   * When `true`, skips rendering `app_bar` and `footer` from a PageContent
   * object. Use this when the caller (e.g. PageLayout) already renders the
   * structural chrome itself — otherwise the TopAppBar and BottomAppBar would
   * be rendered twice, producing a duplicate dark-mode toggle and footer.
   */
  contentItemsOnly?: boolean;
}

export function renderContent(
  content: PageContent | ContentItem,
  configOrOptions?: StackwrightConfig | RenderContentOptions,
  key?: string
) {
  if (!content) return null;

  // Support legacy (config, key) positional args as well as the new options object.
  // Note: `configOrOptions` as StackwrightConfig is accepted for backward compatibility
  // but is not consumed — it was historically needed for the dark-mode toggle logic,
  // which now lives elsewhere in the component tree.
  let options: RenderContentOptions = {};
  if (
    configOrOptions &&
    typeof configOrOptions === 'object' &&
    ('contentItemsOnly' in configOrOptions || 'key' in configOrOptions)
  ) {
    options = configOrOptions as RenderContentOptions;
  } else if (key) {
    options = { key };
  }

  // Full page structure: app_bar + content_items + footer
  if (isPageContent(content)) {
    debugLog('Rendering PageContent', { items: content.content.content_items?.length ?? 0 });

    const elements = [];

    if (!options.contentItemsOnly && content.content.app_bar) {
      elements.push(<TopAppBar key="topbar" {...content.content.app_bar} />);
    }

    if (content.content.content_items) {
      elements.push(
        ...content.content.content_items.map((contentItem: ContentItem, index: number) =>
          renderContentItem(contentItem, `content-item-${index}`)
        )
      );
    }

    if (!options.contentItemsOnly && content.content.footer) {
      elements.push(<BottomAppBar key="footer" {...content.content.footer} />);
    }

    return elements;
  }

  // Single content item
  return renderContentItem(content, options.key ?? key);
}

// Helper function to handle individual content item rendering
const renderContentItem = (contentItem: ContentItem, key?: string) => {
  // Discriminate on the explicit `type` field
  const contentType = (contentItem as Record<string, unknown>).type as string | undefined;

  if (!contentType) {
    console.warn('[Stackwright] Content item missing required "type" field. Skipping.');
    return null;
  }

  // Use the caller-provided key (index-based) or the content type as a stable fallback.
  // Never generate a random key here — a new value on every render breaks reconciliation.
  const itemKey = key || contentType;

  const Component = getComponentByType(contentType);

  if (!Component) {
    console.warn(`[Stackwright] Unknown content type: "${contentType}". No component registered.`);
    return <UnknownContentType key={itemKey} contentType={contentType} />;
  }

  // Dev-mode schema validation for custom content types.
  // Built-in types are validated at prebuild time; custom types are validated here.
  if (process.env.NODE_ENV === 'development') {
    const customSchema = getContentTypeSchema(contentType);
    if (customSchema) {
      const validation = customSchema.safeParse(contentItem);
      if (!validation.success) {
        console.warn(
          `[Stackwright] Invalid props for custom content type "${contentType}":`,
          validation.error.issues
        );
      }
    }
  }

  debugLog(`Rendering "${contentType}"`, { key: itemKey });

  // Spread content item props into the component. The `type` field is passed
  // through but harmlessly ignored by React components (it's not a DOM prop).
  const label = (contentItem as Record<string, unknown>).label as string | undefined;

  return (
    <ContentItemErrorBoundary key={itemKey} contentType={contentType} label={label}>
      <Component {...contentItem} />
    </ContentItemErrorBoundary>
  );
};
