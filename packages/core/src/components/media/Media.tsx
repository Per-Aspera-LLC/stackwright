import React from 'react';
import { ImageContent, MediaItem, VIDEO_EXTENSIONS } from '@stackwright/types';
import { MediaContainer } from './MediaContainer';
import { getStackwrightImage, getIconRegistry } from '../../utils/stackwrightComponentRegistry';

type VideoMediaItem = Extract<MediaItem, { type: 'video' }>;

const VIDEO_EXT_SET = new Set<string>(VIDEO_EXTENSIONS);

const isVideoSource = (src: string): boolean => {
  const ext = src.split('.').pop()?.toLowerCase() ?? '';
  return VIDEO_EXT_SET.has(`.${ext}`);
};

// Heuristic fallbacks for YAML that omits the explicit type field.
// Prefer adding type: "icon" or type: "image" to YAML instead of relying on these.
const isIconSource = (src: string): boolean => {
  return (
    !src.includes('/') &&
    !src.includes('.') &&
    !src.startsWith('http') &&
    !src.startsWith('data:') &&
    src.length > 0
  );
};

// Known theme token names that map to CSS custom properties
const THEME_TOKEN_COLORS = [
  'primary',
  'secondary',
  'accent',
  'background',
  'surface',
  'text',
  'textSecondary',
] as const;

type ThemeTokenColor = (typeof THEME_TOKEN_COLORS)[number];

/** Check if a color string is a known theme token */
function isThemeToken(color: string): color is ThemeTokenColor {
  return THEME_TOKEN_COLORS.includes(color as ThemeTokenColor);
}

/** Convert theme token to CSS variable name */
function themeTokenToCSSVar(token: ThemeTokenColor): string {
  // textSecondary becomes text-secondary in CSS var
  const cssName = token === 'textSecondary' ? 'text-secondary' : token;
  return `--sw-color-${cssName}`;
}

const renderIcon = (src: string, sizePx: number | string, color?: string) => {
  // Registry lookup only — no require(). See packages/icons/AGENTS.md for why.
  const IconComponent = getIconRegistry()?.get(src);

  if (IconComponent) {
    // Handle theme tokens via CSS variables for proper dark mode support
    if (color && isThemeToken(color)) {
      const cssVar = themeTokenToCSSVar(color);
      return <IconComponent size={sizePx} style={{ color: `var(${cssVar})` }} />;
    }
    // Fallback to direct color or currentColor
    return <IconComponent size={sizePx} color={color || 'currentColor'} />;
  }

  console.warn(
    `Icon "${src}" not found in registry. Register it via @stackwright/icons or in _app.tsx.`
  );
  return <span style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>📷 {src}</span>;
};

const renderImage = (content: MediaItem) => {
  const StackwrightImage = getStackwrightImage();
  const imageContent = content as ImageContent;

  const shouldUseFill =
    typeof imageContent.aspect_ratio === 'number' && imageContent.aspect_ratio > 0;
  const resolvedHeight = content.height || (shouldUseFill ? 400 : undefined);
  const resolvedWidth =
    imageContent.aspect_ratio && typeof resolvedHeight === 'number'
      ? Math.round(resolvedHeight / imageContent.aspect_ratio)
      : content.width;

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
  const iconColor = content.type === 'icon' ? content.color : undefined;
  return (
    <MediaContainer height={sizePx} width={sizePx} style={content.style}>
      {renderIcon(content.src, sizePx, iconColor)}
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

const renderVideoMedia = (content: VideoMediaItem) => {
  return (
    <MediaContainer height={content.height} width={content.width} style={content.style}>
      <video
        src={content.src}
        poster={content.poster}
        autoPlay={content.autoplay ?? false}
        loop={content.loop ?? false}
        muted={content.muted ?? true}
        controls={content.controls ?? true}
        preload={content.preload ?? 'metadata'}
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: content.style === 'overflow' ? 'cover' : 'contain',
        }}
      >
        {content.sources?.map((s) => (
          <source key={s.src} src={s.src} type={s.type} />
        ))}
      </video>
    </MediaContainer>
  );
};

/** Renders a basic <video> when only base MediaItem fields are available (heuristic path). */
const renderHeuristicVideo = (content: MediaItem) => {
  return (
    <MediaContainer height={content.height} width={content.width} style={content.style}>
      <video
        src={content.src}
        muted
        controls
        preload="metadata"
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: content.style === 'overflow' ? 'cover' : 'contain',
        }}
      />
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

  if (content.type === 'video') {
    return renderVideoMedia(content);
  }

  // type === 'media' or legacy YAML without a type field — use heuristics.
  if (isIconSource(content.src)) {
    return renderIconMedia(content);
  }

  // Check for video sources before falling back to image.
  if (isVideoSource(content.src)) {
    return renderHeuristicVideo(content);
  }

  // Assume image for paths and URLs.
  if (
    content.src.includes('/') ||
    content.src.includes('.') ||
    content.src.startsWith('http') ||
    content.src.startsWith('data:')
  ) {
    return renderImageMedia(content);
  }

  console.warn(
    `Cannot determine media type for "${content.src}". Add type: "image", type: "icon", or type: "media" to your YAML.`
  );
  return <span style={{ fontSize: '0.75rem' }}>Unknown media: {content.src}</span>;
}
