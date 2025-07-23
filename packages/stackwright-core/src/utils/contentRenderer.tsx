import { v4 as uuidv4 } from 'uuid';
import { ContentItem, PageContent } from '../types/content';
import { TopAppBar, BottomAppBar } from '../components/structural/';
import { StackwrightConfig } from 'config/defaults';
import { getComponentByType } from './componentRegistry';

// Type guard to check if content is PageContent
function isPageContent(content: PageContent | ContentItem): content is PageContent {
    return 'content' in content && 
           typeof content.content === 'object' && 
           content.content !== null;
}

export function renderContent(content: PageContent | ContentItem, config?: StackwrightConfig, key?: string) {
    // If it's a PageContent type, process the full page structure (NERD MODE)
    if (isPageContent(content)) {
        const elements = [];
        
        // Add TopAppBar if app_bar is defined
        if (content.content.app_bar) {
            elements.push(<TopAppBar key="topbar" {...content.content.app_bar} />);
        }
        
        // Add main content - filter out app_bar and footer from content_items
        if (content.content.content_items) {
            const contentItems = content.content.content_items.filter((item: ContentItem) => {
                const contentType = Object.keys(item)[0];
                return contentType !== 'app_bar' && contentType !== 'footer';
            });
            
            elements.push(...contentItems.map((contentItem: ContentItem, index: number) => {
                return renderContentItem(contentItem, `content-item-${index}`);
            }));
        }
        
        // Add BottomAppBar if footer is defined
        if (content.content.footer) {
            elements.push(<BottomAppBar key="footer" {...content.content.footer} />);
        }
        
        return elements;
    }
    
    // If it's a single content item, render it directly
    return renderContentItem(content, key);
};

// Helper function to handle individual content item rendering
const renderContentItem = (contentItem: ContentItem, key?: string) => {
    const entries = Object.entries(contentItem);
    const firstEntry = entries[0];
    
    if (!firstEntry) {
        console.log('ContentRenderer: No content to render');
        return null;
    }
    
    const [contentType, contentData] = firstEntry;
    const itemKey = key || uuidv4();
    
    console.log('ContentRenderer: Processing content type:', contentType);
    
    const Component = getComponentByType(contentType);
    
    if (!Component) {
        console.log('ContentRenderer: Unknown content type:', contentType);
        return null;
    }
    
    // Handle special case for IconGrid which expects 'content' prop
    if (contentType === 'icon_grid') {
        return <Component key={itemKey} content={contentData} />;
    }
    
    return <Component key={itemKey} {...contentData} />;
};