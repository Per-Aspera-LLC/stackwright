import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { runPrebuild } from '../src/prebuild';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpProject(): string {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-prebuild-test-'));
    // Minimal site config
    fs.writeFileSync(path.join(root, 'stackwright.yml'), `
theme: corporate
navigation: []
`);
    fs.mkdirSync(path.join(root, 'pages'), { recursive: true });
    return root;
}

function writePageContent(root: string, slug: string, content: string): void {
    const dir = path.join(root, 'pages', slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'content.yml'), content, 'utf8');
}

function writeFakeImage(dir: string, filename: string): void {
    fs.mkdirSync(dir, { recursive: true });
    // Write a minimal 1x1 PNG header (enough to be non-empty)
    fs.writeFileSync(path.join(dir, filename), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
}

// ---------------------------------------------------------------------------
// Basic output
// ---------------------------------------------------------------------------

describe('runPrebuild — basic output', () => {
    let root: string;

    beforeEach(() => {
        root = makeTmpProject();
    });

    it('creates public/stackwright-content/_site.json from stackwright.yml', () => {
        runPrebuild(root);
        const siteJson = path.join(root, 'public', 'stackwright-content', '_site.json');
        expect(fs.existsSync(siteJson)).toBe(true);
    });

    it('_site.json is valid JSON', () => {
        runPrebuild(root);
        const raw = fs.readFileSync(path.join(root, 'public', 'stackwright-content', '_site.json'), 'utf8');
        expect(() => JSON.parse(raw)).not.toThrow();
    });

    it('creates a slug JSON file for each page', () => {
        writePageContent(root, 'about', `content:\n  content_items: []\n`);
        runPrebuild(root);
        const aboutJson = path.join(root, 'public', 'stackwright-content', 'about.json');
        expect(fs.existsSync(aboutJson)).toBe(true);
    });

    it('produces valid JSON for each page', () => {
        writePageContent(root, 'contact', `content:\n  content_items: []\n`);
        runPrebuild(root);
        const raw = fs.readFileSync(
            path.join(root, 'public', 'stackwright-content', 'contact.json'), 'utf8'
        );
        expect(() => JSON.parse(raw)).not.toThrow();
    });

    it('exits with error when stackwright.yml is missing', () => {
        const emptyRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-no-config-'));
        fs.mkdirSync(path.join(emptyRoot, 'pages'), { recursive: true });
        expect(() => runPrebuild(emptyRoot)).toThrow();
    });
});

// ---------------------------------------------------------------------------
// Image collision prevention
// ---------------------------------------------------------------------------

describe('runPrebuild — image collision prevention', () => {
    let root: string;

    beforeEach(() => {
        root = makeTmpProject();
    });

    it('writes images from different pages to different destination paths (no collision)', () => {
        // Two pages each with a hero.png — they must not overwrite each other.
        const pageADir = path.join(root, 'pages', 'page-a');
        const pageBDir = path.join(root, 'pages', 'page-b');
        writePageContent(root, 'page-a', `content:\n  content_items:\n    - main:\n        media:\n          src: "./hero.png"\n          type: "image"\n`);
        writePageContent(root, 'page-b', `content:\n  content_items:\n    - main:\n        media:\n          src: "./hero.png"\n          type: "image"\n`);

        // Write distinct image content so we can tell them apart after copy
        fs.writeFileSync(path.join(pageADir, 'hero.png'), 'IMAGE_A');
        fs.writeFileSync(path.join(pageBDir, 'hero.png'), 'IMAGE_B');

        runPrebuild(root);

        const destA = path.join(root, 'public', 'images', 'page-a', 'hero.png');
        const destB = path.join(root, 'public', 'images', 'page-b', 'hero.png');

        expect(fs.existsSync(destA)).toBe(true);
        expect(fs.existsSync(destB)).toBe(true);

        // Contents must be different — no collision
        const contentA = fs.readFileSync(destA, 'utf8');
        const contentB = fs.readFileSync(destB, 'utf8');
        expect(contentA).toBe('IMAGE_A');
        expect(contentB).toBe('IMAGE_B');
    });

    it('rewrites relative image paths to /images/<slug>/filename in output JSON', () => {
        const pageDir = path.join(root, 'pages', 'blog');
        writePageContent(root, 'blog', `content:\n  content_items:\n    - main:\n        media:\n          src: "./thumb.png"\n          type: "image"\n`);
        fs.writeFileSync(path.join(pageDir, 'thumb.png'), 'THUMB_DATA');

        runPrebuild(root);

        const raw = fs.readFileSync(
            path.join(root, 'public', 'stackwright-content', 'blog.json'), 'utf8'
        );
        const json = JSON.parse(raw);
        const jsonStr = JSON.stringify(json);
        // Path should be rewritten to include /images/blog/
        expect(jsonStr).toContain('/images/blog/thumb.png');
        // Original relative path should no longer appear
        expect(jsonStr).not.toContain('./thumb.png');
    });
});

// ---------------------------------------------------------------------------
// Missing images
// ---------------------------------------------------------------------------

describe('runPrebuild — missing images', () => {
    let root: string;

    beforeEach(() => {
        root = makeTmpProject();
    });

    it('does not throw when a referenced image file is missing', () => {
        writePageContent(root, 'missing-img', `content:\n  content_items:\n    - main:\n        media:\n          src: "./does-not-exist.png"\n          type: "image"\n`);
        // Should warn but not crash
        expect(() => runPrebuild(root)).not.toThrow();
    });

    it('leaves the original path unchanged when image is missing', () => {
        writePageContent(root, 'missing-img', `content:\n  content_items:\n    - main:\n        media:\n          src: "./does-not-exist.png"\n          type: "image"\n`);
        runPrebuild(root);
        const raw = fs.readFileSync(
            path.join(root, 'public', 'stackwright-content', 'missing-img.json'), 'utf8'
        );
        expect(raw).toContain('./does-not-exist.png');
    });
});
