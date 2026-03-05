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

const isImageSource = (src: string): boolean => {
    const lower = src.toLowerCase();
    return (
        lower.startsWith('./') ||
        lower.startsWith('http') ||
        lower.startsWith('data:') ||
        lower.startsWith('/')
    ) && (
        lower.endsWith('.png') ||
        lower.endsWith('.jpg') ||
        lower.endsWith('.webp') ||
        lower.endsWith('.bmp') ||
        lower.endsWith('.gif')
    );
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

export function Media(content: MediaItem) {
    if (!content.src) {
        return <span>No src set for Media</span>;
    }

    // Discriminator-first: all three types now carry a required `type` field.
    if (content.type === 'icon') {
        const sizePx = typeof content.height === 'number' ? content.height : 24;
        return (
            <MediaContainer height={sizePx} width={sizePx} style={content.style}>
                {renderIcon(content.src, sizePx, content.color)}
            </MediaContainer>
        );
    }
    if (content.type === 'image') {
        return (
            <MediaContainer height={content.height} width={content.width} style={content.style}>
                {renderImage(content)}
            </MediaContainer>
        );
    }
    if (content.type === 'media') {
        // Bare media: fall back to heuristics on src to decide icon vs image.
        if (isIconSource(content.src)) {
            const sizePx = typeof content.height === 'number' ? content.height : 24;
            return (
                <MediaContainer height={sizePx} width={sizePx} style={content.style}>
                    {renderIcon(content.src, sizePx)}
                </MediaContainer>
            );
        }
        return (
            <MediaContainer height={content.height || 'auto'} width={content.width || '100%'} style={content.style}>
                {renderImage(content)}
            </MediaContainer>
        );
    }

    // Legacy fallback: YAML written before discriminators were required.
    // Deprecated — add type: "image", type: "icon", or type: "media" to YAML.
    if (isIconSource(content.src)) {
        const sizePx = typeof content.height === 'number' ? content.height : 24;
        return (
            <MediaContainer height={sizePx} width={sizePx} style={content.style}>
                {renderIcon(content.src, sizePx, (content as any).color)}
            </MediaContainer>
        );
    }

    if (isImageSource(content.src)) {
        return (
            <MediaContainer height={content.height || 'auto'} width={content.width || '100%'} style={content.style}>
                {renderImage(content)}
            </MediaContainer>
        );
    }

    console.warn(`Cannot determine media type for "${content.src}". Add type: "image", type: "icon", or type: "media" to your YAML.`);
    return <span style={{ fontSize: '0.75rem' }}>Unknown media: {content.src}</span>;
}
