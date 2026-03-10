import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { runWatch } from '../src/watch';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpProject(): string {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-watch-test-'));
    fs.writeFileSync(path.join(root, 'stackwright.yml'), `
title: Test Site
navigation: []
appBar:
  titleText: Test Site
`);
    fs.mkdirSync(path.join(root, 'pages'), { recursive: true });
    return root;
}

function writePageContent(root: string, slug: string, content: string): void {
    const dir = path.join(root, 'pages', slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'content.yml'), content, 'utf8');
}

/** Wait for a specified number of milliseconds. */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('runWatch', () => {
    let root: string;
    let cleanup: (() => void) | null = null;

    // Override process.exit and SIGINT/SIGTERM handlers to prevent test runner exit
    const originalExit = process.exit;
    const originalOn = process.on;

    beforeEach(() => {
        root = makeTmpProject();
        // Write an initial page so there's content
        writePageContent(root, 'home', `content:\n  content_items: []\n`);

        // Prevent process.exit from killing the test runner
        process.exit = vi.fn() as any;
    });

    afterEach(() => {
        process.exit = originalExit;
        if (cleanup) {
            cleanup();
            cleanup = null;
        }
    });

    it('performs an initial build on startup', () => {
        // Capture the registered signal handlers so we can clean up
        const handlers: Record<string, Function> = {};
        const origProcessOn = process.on.bind(process);
        process.on = vi.fn((event: string, handler: Function) => {
            handlers[event] = handler;
            return process;
        }) as any;

        runWatch(root);

        // Verify the initial build ran — _site.json should exist
        const siteJson = path.join(root, 'public', 'stackwright-content', '_site.json');
        expect(fs.existsSync(siteJson)).toBe(true);

        const homeJson = path.join(root, 'public', 'stackwright-content', 'home.json');
        expect(fs.existsSync(homeJson)).toBe(true);

        // Clean up by triggering SIGTERM handler
        if (handlers['SIGTERM']) handlers['SIGTERM']();

        process.on = origProcessOn as any;
    });

    it('rebuilds when a YAML file changes', async () => {
        const handlers: Record<string, Function> = {};
        const origProcessOn = process.on.bind(process);
        process.on = vi.fn((event: string, handler: Function) => {
            handlers[event] = handler;
            return process;
        }) as any;

        runWatch(root);

        // Initial build should have created home.json
        const homeJson = path.join(root, 'public', 'stackwright-content', 'home.json');
        expect(fs.existsSync(homeJson)).toBe(true);

        // Now add a new page — the watcher should pick it up
        writePageContent(root, 'about', `content:\n  content_items: []\n`);

        // Wait for debounce (150ms) + processing time
        await sleep(500);

        const aboutJson = path.join(root, 'public', 'stackwright-content', 'about.json');
        expect(fs.existsSync(aboutJson)).toBe(true);

        // Clean up
        if (handlers['SIGTERM']) handlers['SIGTERM']();
        process.on = origProcessOn as any;
    });

    it('rebuilds when site config changes', async () => {
        const handlers: Record<string, Function> = {};
        const origProcessOn = process.on.bind(process);
        process.on = vi.fn((event: string, handler: Function) => {
            handlers[event] = handler;
            return process;
        }) as any;

        runWatch(root);

        const siteJson = path.join(root, 'public', 'stackwright-content', '_site.json');
        const originalContent = fs.readFileSync(siteJson, 'utf8');

        // Modify site config
        fs.writeFileSync(path.join(root, 'stackwright.yml'), `
title: Updated Site Title
navigation: []
appBar:
  titleText: Updated
`);

        await sleep(500);

        const updatedContent = fs.readFileSync(siteJson, 'utf8');
        expect(updatedContent).toContain('Updated Site Title');
        expect(updatedContent).not.toEqual(originalContent);

        // Clean up
        if (handlers['SIGTERM']) handlers['SIGTERM']();
        process.on = origProcessOn as any;
    });

    it('survives validation errors and continues watching', async () => {
        const handlers: Record<string, Function> = {};
        const origProcessOn = process.on.bind(process);
        process.on = vi.fn((event: string, handler: Function) => {
            handlers[event] = handler;
            return process;
        }) as any;

        runWatch(root);

        // Write invalid content — should not crash the watcher
        writePageContent(root, 'bad', `content:\n  heading: "oops"\n`);

        await sleep(500);

        // Watcher should still be alive — process.exit should NOT have been
        // called (we mocked it, so we can check)
        // Note: process.exit IS called in cleanup(), but not during error handling
        expect(process.exit).not.toHaveBeenCalled();

        // Fix the bad page and add a new valid one — watcher should recover
        writePageContent(root, 'bad', `content:\n  content_items: []\n`);
        writePageContent(root, 'fixed', `content:\n  content_items: []\n`);

        await sleep(500);

        const fixedJson = path.join(root, 'public', 'stackwright-content', 'fixed.json');
        expect(fs.existsSync(fixedJson)).toBe(true);

        // Clean up
        if (handlers['SIGTERM']) handlers['SIGTERM']();
        process.on = origProcessOn as any;
    });

    it('does not rebuild for non-content files', async () => {
        const handlers: Record<string, Function> = {};
        const origProcessOn = process.on.bind(process);
        process.on = vi.fn((event: string, handler: Function) => {
            handlers[event] = handler;
            return process;
        }) as any;

        runWatch(root);

        const siteJson = path.join(root, 'public', 'stackwright-content', '_site.json');
        const originalMtime = fs.statSync(siteJson).mtimeMs;

        // Write a non-content file (e.g., a .tsx file) in pages/
        fs.writeFileSync(path.join(root, 'pages', 'test.tsx'), 'export default () => null;');

        await sleep(500);

        // _site.json should not have been rewritten
        const newMtime = fs.statSync(siteJson).mtimeMs;
        expect(newMtime).toBe(originalMtime);

        // Clean up
        if (handlers['SIGTERM']) handlers['SIGTERM']();
        process.on = origProcessOn as any;
    });
});
