import React from 'react';
import { ImageContent, MediaItem } from '@stackwright/types';
import { MediaContainer } from './MediaContainer';
import { getStackwrightImage, getIconRegistry } from '../../utils/stackwrightComponentRegistry';

// Heuristic fallbacks for YAML that omits the explicit type field.
// Prefer adding type: "icon" or type: "image" to YAML instead of relying on these.
const isIconSource = (src: string): boolean => {
    return !src.includes('/') &&
           !src.includes('.') &&
           !src.startsWith('http') &&
           !src.startsWith('data:') &&
           src.length > 0;
};

const renderIcon = (src: string, sizePx: number | string, color?: string) => {
    // Registry lookup only — no require(). See packages/icons/AGENTS.md for why.
    const IconComponent = getIconRegistry()?.get(src);

    if (IconComponent) {
        return (
            <IconComponent
                size={sizePx}
                color={color || 'currentColor'}
            />
        );
    }

    console.warn(`Icon "${src}" not found in registry. Register it via @stackwright/icons or in _app.tsx.`);
    return <span style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>📷 {src}</span>;
};

const renderImage = (content: MediaItem) => {
    const StackwrightImage = getStackwrightImage();
    const imageContent = content as ImageContent;

    const shouldUseFill = (typeof imageContent.aspect_ratio === 'number' && imageContent.aspect_ratio > 0);
    const resolvedHeight = content.height || (shouldUseFill ? 400 : undefined);
    const resolvedWidth = (imageContent.aspect_ratio && typeof resolvedHeight === 'number')
        ? Math.round(resolvedHeight / imageContent.aspect_ratio) : content.width;

    return (
        <StackwrightImage
            src={content.src}
            alt={content.alt || content.label || ''}
            aspect_ratio={imageContent?.aspect_ratio || 0}
            width={resolvedWidth}
            height={resolvedHeight}
            fill={shouldUseFill}
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={true}
        />
    );
};

const renderIconMedia = (content: MediaItem) => {
    const sizePx = typeof content.height === 'number' ? content.height : 24;
    return (
        <MediaContainer height={sizePx} width={sizePx} style={content.style}>
            {renderIcon(content.src, sizePx, (content as any).color)}
        </MediaContainer>
    );
};

const renderImageMedia = (content: MediaItem) => {
    const imageContent = content as ImageContent;
    return (
        <MediaContainer
            height={content.height}
            width={content.width}
            aspectRatio={imageContent.aspect_ratio}
            style={content.style}
        >
            {renderImage(content)}
        </MediaContainer>
    );
};

export function Media(content: MediaItem) {
    if (!content.src) {
        return <span>No src set for Media</span>;
    }

    if (content.type === 'icon') {
        return renderIconMedia(content);
    }

    if (content.type === 'image') {
        return renderImageMedia(content);
    }

    // type === 'media' or legacy YAML without a type field — use heuristics.
    if (isIconSource(content.src)) {
        return renderIconMedia(content);
    }

    // Assume image for paths and URLs.
    if (content.src.includes('/') || content.src.includes('.') ||
        content.src.startsWith('http') || content.src.startsWith('data:')) {
        return renderImageMedia(content);
    }

    console.warn(`Cannot determine media type for "${content.src}". Add type: "image", type: "icon", or type: "media" to your YAML.`);
    return <span style={{ fontSize: '0.75rem' }}>Unknown media: {content.src}</span>;
}
