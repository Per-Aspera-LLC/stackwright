import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { Media } from '../../src/components/media/Media';

describe('Media — video type', () => {
  it('renders a <video> element for type: video', () => {
    const { container } = render(<Media type="video" src="/videos/demo.mp4" label="test-video" />);
    const video = container.querySelector('video');
    expect(video).toBeTruthy();
    expect(video?.getAttribute('src')).toBe('/videos/demo.mp4');
  });

  it('sets autoplay, muted, loop attributes', () => {
    const { container } = render(
      <Media
        type="video"
        src="/videos/demo.mp4"
        label="test-video"
        autoplay={true}
        loop={true}
        muted={true}
      />
    );
    const video = container.querySelector('video');
    expect(video?.autoplay).toBe(true);
    expect(video?.loop).toBe(true);
    expect(video?.muted).toBe(true);
  });

  it('defaults controls to true and muted to true', () => {
    const { container } = render(<Media type="video" src="/videos/demo.mp4" label="test-video" />);
    const video = container.querySelector('video');
    expect(video?.controls).toBe(true);
    expect(video?.muted).toBe(true);
  });

  it('renders poster attribute when provided', () => {
    const { container } = render(
      <Media type="video" src="/videos/demo.mp4" label="test-video" poster="/images/poster.jpg" />
    );
    const video = container.querySelector('video');
    expect(video?.getAttribute('poster')).toBe('/images/poster.jpg');
  });

  it('renders <source> elements for multi-format fallback', () => {
    const { container } = render(
      <Media
        type="video"
        src="/videos/demo.mp4"
        label="test-video"
        sources={[
          { src: '/videos/demo.webm', type: 'video/webm' },
          { src: '/videos/demo.mp4', type: 'video/mp4' },
        ]}
      />
    );
    const sources = container.querySelectorAll('source');
    expect(sources.length).toBe(2);
    expect(sources[0]?.getAttribute('src')).toBe('/videos/demo.webm');
    expect(sources[0]?.getAttribute('type')).toBe('video/webm');
    expect(sources[1]?.getAttribute('src')).toBe('/videos/demo.mp4');
    expect(sources[1]?.getAttribute('type')).toBe('video/mp4');
  });

  it('renders video for heuristic .mp4 detection (type: media)', () => {
    const { container } = render(<Media type="media" src="/videos/demo.mp4" label="test-video" />);
    const video = container.querySelector('video');
    expect(video).toBeTruthy();
  });

  it('renders video for heuristic .webm detection (type: media)', () => {
    const { container } = render(<Media type="media" src="/assets/clip.webm" label="test-video" />);
    const video = container.querySelector('video');
    expect(video).toBeTruthy();
  });

  it('sets playsInline attribute', () => {
    const { container } = render(<Media type="video" src="/videos/demo.mp4" label="test-video" />);
    const video = container.querySelector('video');
    // React renders playsInline as the playsinline attribute in the DOM
    expect(video?.playsInline).toBe(true);
  });

  it('uses object-fit: cover when style is overflow', () => {
    const { container } = render(
      <Media type="video" src="/videos/demo.mp4" label="test-video" style="overflow" />
    );
    const video = container.querySelector('video');
    expect(video?.style.objectFit).toBe('cover');
  });

  it('uses object-fit: contain by default', () => {
    const { container } = render(<Media type="video" src="/videos/demo.mp4" label="test-video" />);
    const video = container.querySelector('video');
    expect(video?.style.objectFit).toBe('contain');
  });

  it('renders preload attribute', () => {
    const { container } = render(
      <Media type="video" src="/videos/demo.mp4" label="test" preload="none" />
    );
    expect(container.querySelector('video')?.getAttribute('preload')).toBe('none');
  });

  it('applies defaults in heuristic path (type: media with .mp4)', () => {
    const { container } = render(<Media type="media" src="/videos/demo.mp4" label="test" />);
    const video = container.querySelector('video');
    expect(video?.controls).toBe(true);
    expect(video?.muted).toBe(true);
  });
});
