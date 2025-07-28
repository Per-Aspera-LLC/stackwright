import { BaseContent, ButtonContent } from './base';
import { AppBarContent } from './navigation';
import { ContentItem } from './content';

export interface FooterContent extends BaseContent {
    copyright: string
    buttons: ButtonContent[]
    sociallinks?: ButtonContent[]
    socialtext?: string
}

export interface PageContent {
    content: {
        app_bar?: AppBarContent
        footer?: FooterContent
        content_items: ContentItem[],
        list_icon?: String
    }
}