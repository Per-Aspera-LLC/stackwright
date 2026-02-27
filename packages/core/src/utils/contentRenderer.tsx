import { ContentItem, PageContent } from '@stackwright/types'
import { TopAppBar, BottomAppBar } from '../components/structural/';
import { StackwrightConfig } from '../config/defaults';
import { getComponentByType } from './componentRegistry';
import { getContentTypeSchema } from './contentTypeRegistry';

// Debug logging utility - only logs in development
const debugLog = (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development' && process.env.STACKWRIGHT_DEBUG === 'true') {
        console.log(`🐛 ContentRenderer Debug: ${message}`, data ? data : '');
    }
};

// Type guard to check if content is PageContent
function isPageContent(content: PageContent | ContentItem): content is PageContent {
    return content != null &&
           'content' in content &&
           typeof content.content === 'object' &&
           content.content !== null;
}

export function renderContent(content: PageContent | ContentItem, config?: StackwrightConfig, key?: string) {
    debugLog('renderContent called with:', {
        contentType: typeof content,
        hasContent: !!content,
        isPageContent: isPageContent(content),
        configProvided: !!config,
        keyProvided: !!key
    });
    
    // Add null check at the beginning
    if (!content) {
        debugLog('No content provided, returning null');
        return null;
    }
    
    // If it's a PageContent type, process the full page structure (NERD MODE)
    if (isPageContent(content)) {
        debugLog('Processing PageContent structure');
        const elements = [];
        
        // Add TopAppBar if app_bar is defined
        if (content.content.app_bar) {
            debugLog('Adding TopAppBar component', content.content.app_bar);
            try {
                const topAppBar = <TopAppBar key="topbar" {...content.content.app_bar} />;
                debugLog('TopAppBar created successfully');
                elements.push(topAppBar);
            } catch (error) {
                debugLog('Error creating TopAppBar:', error);
                throw error;
            }
        }
        
        // Add main content - filter out app_bar and footer from content_items
        if (content.content.content_items) {
            debugLog('Processing content_items', { count: content.content.content_items.length });
            const contentItems = content.content.content_items.filter((item: ContentItem) => {
                const contentType = Object.keys(item)[0];
                const shouldInclude = contentType !== 'app_bar' && contentType !== 'footer';
                debugLog(`Filtering content item: ${contentType} - included: ${shouldInclude}`);
                return shouldInclude;
            });
            
            debugLog('Filtered content items', { count: contentItems.length });
            
            const renderedItems = contentItems.map((contentItem: ContentItem, index: number) => {
                debugLog(`Rendering content item ${index}:`, contentItem);
                try {
                    const rendered = renderContentItem(contentItem, `content-item-${index}`);
                    debugLog(`Successfully rendered content item ${index}`);
                    return rendered;
                } catch (error) {
                    debugLog(`Error rendering content item ${index}:`, error);
                    throw error;
                }
            });
            
            elements.push(...renderedItems);
        }
        
        // Add BottomAppBar if footer is defined
        if (content.content.footer) {
            debugLog('Adding BottomAppBar component', content.content.footer);
            try {
                const bottomAppBar = <BottomAppBar key="footer" {...content.content.footer} />;
                debugLog('BottomAppBar created successfully');
                elements.push(bottomAppBar);
            } catch (error) {
                debugLog('Error creating BottomAppBar:', error);
                throw error;
            }
        }
        
        debugLog('Returning PageContent elements', { count: elements.length });
        return elements;
    }
    
    // If it's a single content item, render it directly
    debugLog('Processing single ContentItem');
    try {
        const result = renderContentItem(content, key);
        debugLog('Successfully rendered single ContentItem');
        return result;
    } catch (error) {
        debugLog('Error rendering single ContentItem:', error);
        throw error;
    }
};

// Helper function to handle individual content item rendering
const renderContentItem = (contentItem: ContentItem, key?: string) => {
    debugLog('renderContentItem called', { contentItem, key });

    const entries = Object.entries(contentItem);
    debugLog('Content item entries:', entries);
    const firstEntry = entries[0];

    if (!firstEntry) {
        debugLog('No content entries found, returning null');
        return null;
    }

    const [contentType, contentData] = firstEntry;
    // Use the caller-provided key (index-based) or the content type as a stable fallback.
    // Never generate a random key here — a new value on every render breaks reconciliation.
    const itemKey = key || contentType;
    
    debugLog(`Processing content type: ${contentType}`, {
        contentType,
        contentData,
        itemKey
    });
    
    const Component = getComponentByType(contentType);

    if (!Component) {
        debugLog(`No component found for content type: ${contentType}`);
        return null;
    }

    debugLog(`Retrieved component for ${contentType}:`, {
        componentType: typeof Component,
        componentName: Component?.name,
        isFunction: typeof Component === 'function',
    });
    
    // Dev-mode schema validation for custom content types.
    // Built-in types are validated at prebuild time; custom types are validated here.
    if (process.env.NODE_ENV === 'development') {
        const customSchema = getContentTypeSchema(contentType);
        if (customSchema) {
            const validation = customSchema.safeParse(contentData);
            if (!validation.success) {
                console.warn(
                    `[Stackwright] Invalid props for custom content type "${contentType}":`,
                    validation.error.issues,
                );
            }
        }
    }

    debugLog(`Creating React element for ${contentType}`);

    try {
        let element;

        debugLog('Creating component with spread props');
        element = <Component key={itemKey} {...contentData} />;
        
        debugLog(`Successfully created React element for ${contentType}`);
        return element;
        
    } catch (error) {
        debugLog(`Error creating React element for ${contentType}:`, error);
        throw error;
    }
};