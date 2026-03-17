import { describe, it, expect } from 'vitest';
import { mediaItemSchema } from '@stackwright/types';

describe('Video MediaItem schema', () => {
  it('validates a minimal video media item', () => {
    const result = mediaItemSchema.safeParse({
      type: 'video',
      src: '/videos/demo.mp4',
    });
    expect(result.success).toBe(true);
  });

  it('validates a full video media item with all optional fields', () => {
    const result = mediaItemSchema.safeParse({
      type: 'video',
      src: '/videos/demo.mp4',
      alt: 'Demo video',
      poster: '/images/poster.jpg',
      autoplay: true,
      loop: true,
      muted: true,
      controls: false,
      preload: 'auto',
      sources: [
        { src: '/videos/demo.webm', type: 'video/webm' },
        { src: '/videos/demo.mp4', type: 'video/mp4' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts preload: "metadata"', () => {
    const result = mediaItemSchema.safeParse({
      type: 'video',
      src: '/videos/demo.mp4',
      preload: 'metadata',
    });
    expect(result.success).toBe(true);
  });

  it('accepts preload: "none"', () => {
    const result = mediaItemSchema.safeParse({
      type: 'video',
      src: '/videos/demo.mp4',
      preload: 'none',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid preload value', () => {
    const result = mediaItemSchema.safeParse({
      type: 'video',
      src: '/videos/demo.mp4',
      preload: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects video without src', () => {
    const result = mediaItemSchema.safeParse({
      type: 'video',
    });
    expect(result.success).toBe(false);
  });

  it('accepts sources with optional type field', () => {
    const result = mediaItemSchema.safeParse({
      type: 'video',
      src: '/videos/demo.mp4',
      sources: [{ src: '/videos/demo.webm' }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts common media base fields (height, width, style)', () => {
    const result = mediaItemSchema.safeParse({
      type: 'video',
      src: '/videos/demo.mp4',
      height: 480,
      width: 640,
      style: 'contained',
    });
    expect(result.success).toBe(true);
  });

  it('rejects sources with missing src field', () => {
    const result = mediaItemSchema.safeParse({
      type: 'video',
      src: '/videos/demo.mp4',
      sources: [{ notSrc: 'x' }],
    });
    expect(result.success).toBe(false);
  });

  it('strips image-specific fields from video variant', () => {
    const result = mediaItemSchema.safeParse({
      type: 'video',
      src: '/videos/demo.mp4',
      aspect_ratio: 1.5,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).aspect_ratio).toBeUndefined();
    }
  });

  it('parses correct data shape', () => {
    const result = mediaItemSchema.safeParse({
      type: 'video',
      src: '/videos/demo.mp4',
      poster: '/images/poster.jpg',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('video');
      expect(result.data.src).toBe('/videos/demo.mp4');
    }
  });
});
