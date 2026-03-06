import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerContentTypeTools } from "../src/tools/content-types";
import { registerPageTools } from "../src/tools/pages";
import { registerProjectTools } from "../src/tools/project";
import { registerSiteTools } from "../src/tools/site";
import { registerGitOpsTools } from "../src/tools/git-ops";
import { getTypes } from "@stackwright/cli";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";

const exec = promisify(execFile);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpDir(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), "sw-mcp-test-"));
}

function makePageYaml(slug: string, heading?: string): string {
    return `content:
  content_items:
    - main:
        label: "${slug}"
        heading:
          text: "${heading || slug}"
          textSize: "h1"
        textBlocks:
          - text: "Test page body"
            textSize: "body1"
`;
}

function makeValidSiteConfig(): string {
    return `title: "Test Site"
themeName: "per-aspera"
description: "A test site"
navigation:
  - label: "Home"
    href: "/"
appBar:
  titleText: "Test Site"
footer:
  copyright: "© 2026 Test"
`;
}

function makePackageJson(name: string): string {
    return `{
  "name": "${name}",
  "version": "1.0.0",
  "dependencies": {
    "@stackwright/core": "latest",
    "@stackwright/themes": "latest",
    "@stackwright/nextjs": "latest"
  }
}
`;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MCP Tools Integration", () => {
    let testDir: string;
    let pagesDir: string;

    beforeEach(() => {
        testDir = makeTmpDir();
        pagesDir = path.join(testDir, "content", "pages");
        fs.ensureDirSync(pagesDir);
    });

    afterEach(() => {
        fs.removeSync(testDir);
    });

    describe("Content Type Tools", () => {
        it("registers content type tool and returns types", async () => {
            const server = new McpServer({ name: "test", version: "1.0.0" });
            registerContentTypeTools(server);

            // Verify tool was registered by checking the internal registry
            const tools = Object.keys((server as any)._registeredTools);
            expect(tools).toContain("stackwright_get_content_types");

            // Test the tool handler directly
            const tool = (server as any)._registeredTools[
                "stackwright_get_content_types"
            ];
            const result = await tool.handler({});

            expect(result.content).toBeDefined();
            expect(Array.isArray(result.content)).toBe(true);
            expect(result.content[0].type).toBe("text");

            const textContent = result.content[0].text;
            expect(textContent).toContain("CONTENT TYPES");
            expect(textContent).toContain("SUB-TYPES");
            expect(textContent).toContain("stackwright_preview_component");

            // Verify it matches actual CLI types
            const types = getTypes();
            expect(types.contentTypes.length).toBeGreaterThan(0);
            expect(types.subTypes.length).toBeGreaterThan(0);
        });

        it("registers preview_component tool", async () => {
            const server = new McpServer({ name: "test", version: "1.0.0" });
            registerContentTypeTools(server);

            const tools = Object.keys((server as any)._registeredTools);
            expect(tools).toContain("stackwright_preview_component");
        });

        it("preview_component rejects unknown content types", async () => {
            const server = new McpServer({ name: "test", version: "1.0.0" });
            registerContentTypeTools(server);

            const tool = (server as any)._registeredTools[
                "stackwright_preview_component"
            ];
            const result = await tool.handler({ content_type: "nonexistent" });

            expect(result.isError).toBe(true);
            expect(result.content[0].text).toContain("Unknown content type");
        });

        it("preview_component returns graceful message when no screenshot exists", async () => {
            const server = new McpServer({ name: "test", version: "1.0.0" });
            registerContentTypeTools(server);

            const tool = (server as any)._registeredTools[
                "stackwright_preview_component"
            ];
            // Temporarily rename the screenshot if it exists to test the missing path
            const screenshotsDir = path.resolve(__dirname, "../screenshots");
            const screenshotPath = path.join(screenshotsDir, "main-desktop.png");
            const backupPath = screenshotPath + ".bak";
            const existed = fs.existsSync(screenshotPath);
            if (existed) fs.renameSync(screenshotPath, backupPath);

            try {
                const result = await tool.handler({ content_type: "main" });
                expect(result.isError).toBeUndefined();
                expect(result.content[0].text).toContain("No preview screenshot available");
            } finally {
                if (existed) fs.renameSync(backupPath, screenshotPath);
            }
        });

        it("preview_component returns image when screenshot exists", async () => {
            const server = new McpServer({ name: "test", version: "1.0.0" });
            registerContentTypeTools(server);

            // Create a fake screenshot in the expected location
            const screenshotsDir = path.resolve(
                __dirname,
                "../screenshots",
            );
            fs.ensureDirSync(screenshotsDir);
            const fakePng = Buffer.from("fake-png-data");
            fs.writeFileSync(
                path.join(screenshotsDir, "faq-desktop.png"),
                fakePng,
            );

            const tool = (server as any)._registeredTools[
                "stackwright_preview_component"
            ];
            const result = await tool.handler({ content_type: "faq" });

            expect(result.content).toHaveLength(2);
            expect(result.content[0].type).toBe("text");
            expect(result.content[0].text).toContain("faq");
            expect(result.content[1].type).toBe("image");
            expect(result.content[1].mimeType).toBe("image/png");
            expect(result.content[1].data).toBe(fakePng.toString("base64"));

            // Cleanup
            fs.removeSync(path.join(screenshotsDir, "faq-desktop.png"));
        });
    });

    describe("Page Tools", () => {
        it("registers page tools and lists pages", async () => {
            const server = new McpServer({ name: "test", version: "1.0.0" });
            registerPageTools(server);

            const tools = Object.keys((server as any)._registeredTools);
            expect(tools).toContain("stackwright_list_pages");
            expect(tools).toContain("stackwright_add_page");
            expect(tools).toContain("stackwright_validate_pages");
        });

        it("list_pages returns empty list when no pages exist", async () => {
            const server = new McpServer({ name: "test", version: "1.0.0" });
            registerPageTools(server);

            const tool = (server as any)._registeredTools[
                "stackwright_list_pages"
            ];
            const result = await tool.handler({ projectRoot: testDir });

            expect(result.content[0].text).toContain("No pages found");
        });

        it("list_pages shows existing pages", async () => {
            // Create test pages
            const page1Dir = path.join(pagesDir, "about");
            fs.ensureDirSync(page1Dir);
            fs.writeFileSync(
                path.join(page1Dir, "content.yml"),
                makePageYaml("about", "About Us"),
            );

            const server = new McpServer({ name: "test", version: "1.0.0" });
            registerPageTools(server);

            const tool = (server as any)._registeredTools[
                "stackwright_list_pages"
            ];
            const result = await tool.handler({ projectRoot: testDir });

            const textContent = result.content[0].text;
            expect(textContent).toContain("Pages (1)");
            expect(textContent).toContain("about  —  About Us");
        });

        it("add_page creates new pages", async () => {
            const server = new McpServer({ name: "test", version: "1.0.0" });
            registerPageTools(server);

            const tool = (server as any)._registeredTools[
                "stackwright_add_page"
            ];
            const result = await tool.handler({
                projectRoot: testDir,
                slug: "new-page",
                heading: "New Page Title",
            });

            expect(result.content[0].text).toContain(
                'Created page "/new-page"',
            );

            // Verify file was created
            const pagePath = path.join(pagesDir, "new-page", "content.yml");
            expect(fs.existsSync(pagePath)).toBe(true);
            expect(fs.readFileSync(pagePath, "utf8")).toContain(
                "New Page Title",
            );
        });

        it("get_page returns page YAML content", async () => {
            const pageDir = path.join(pagesDir, "about");
            fs.ensureDirSync(pageDir);
            const yamlContent = makePageYaml("about", "About Us");
            fs.writeFileSync(
                path.join(pageDir, "content.yml"),
                yamlContent,
            );

            const server = new McpServer({ name: "test", version: "1.0.0" });
            registerPageTools(server);

            const tool = (server as any)._registeredTools[
                "stackwright_get_page"
            ];
            const result = await tool.handler({
                projectRoot: testDir,
                slug: "about",
            });

            expect(result.content[0].text).toContain("About Us");
            expect(result.content[0].text).toContain('Page "/about"');
            expect(result.isError).toBeFalsy();
        });

        it("get_page returns error for missing page", async () => {
            const server = new McpServer({ name: "test", version: "1.0.0" });
            registerPageTools(server);

            const tool = (server as any)._registeredTools[
                "stackwright_get_page"
            ];
            const result = await tool.handler({
                projectRoot: testDir,
                slug: "nonexistent",
            });

            expect(result.isError).toBe(true);
            expect(result.content[0].text).toContain("Page not found");
        });

        it("write_page writes valid YAML and creates new page", async () => {
            const server = new McpServer({ name: "test", version: "1.0.0" });
            registerPageTools(server);

            const tool = (server as any)._registeredTools[
                "stackwright_write_page"
            ];
            const yamlContent = makePageYaml("new-page", "New Page Title");
            const result = await tool.handler({
                projectRoot: testDir,
                slug: "new-page",
                content: yamlContent,
            });

            expect(result.content[0].text).toContain('Created page "/new-page"');
            expect(result.isError).toBeFalsy();

            // Verify file was written
            const pagePath = path.join(pagesDir, "new-page", "content.yml");
            expect(fs.existsSync(pagePath)).toBe(true);
            expect(fs.readFileSync(pagePath, "utf8")).toContain("New Page Title");
        });

        it("write_page updates existing page", async () => {
            const pageDir = path.join(pagesDir, "existing");
            fs.ensureDirSync(pageDir);
            fs.writeFileSync(
                path.join(pageDir, "content.yml"),
                makePageYaml("existing", "Old Title"),
            );

            const server = new McpServer({ name: "test", version: "1.0.0" });
            registerPageTools(server);

            const tool = (server as any)._registeredTools[
                "stackwright_write_page"
            ];
            const result = await tool.handler({
                projectRoot: testDir,
                slug: "existing",
                content: makePageYaml("existing", "New Title"),
            });

            expect(result.content[0].text).toContain('Updated page "/existing"');
            expect(result.isError).toBeFalsy();
        });

        it("write_page rejects invalid YAML with field-level errors", async () => {
            const server = new McpServer({ name: "test", version: "1.0.0" });
            registerPageTools(server);

            const tool = (server as any)._registeredTools[
                "stackwright_write_page"
            ];
            const result = await tool.handler({
                projectRoot: testDir,
                slug: "bad-page",
                content: "invalid_key: true\n",
            });

            expect(result.isError).toBe(true);
            expect(result.content[0].text).toContain("Validation failed");

            // Verify file was NOT written
            const pagePath = path.join(pagesDir, "bad-page", "content.yml");
            expect(fs.existsSync(pagePath)).toBe(false);
        });

        it("validate_pages returns success for valid pages", async () => {
            const pageDir = path.join(pagesDir, "about");
            fs.ensureDirSync(pageDir);
            fs.writeFileSync(
                path.join(pageDir, "content.yml"),
                makePageYaml("about", "About Us"),
            );

            const server = new McpServer({ name: "test", version: "1.0.0" });
            registerPageTools(server);

            const tool = (server as any)._registeredTools[
                "stackwright_validate_pages"
            ];
            const result = await tool.handler({ projectRoot: testDir });

            expect(result.content[0].text).toContain(
                "✓ Validation passed for all pages",
            );
            expect(result.isError).toBeFalsy();
        });

        it("validate_pages returns errors for invalid pages", async () => {
            const pageDir = path.join(pagesDir, "broken");
            fs.ensureDirSync(pageDir);
            fs.writeFileSync(
                path.join(pageDir, "content.yml"),
                "invalid: yaml: content: [[",
            );

            const server = new McpServer({ name: "test", version: "1.0.0" });
            registerPageTools(server);

            const tool = (server as any)._registeredTools[
                "stackwright_validate_pages"
            ];
            const result = await tool.handler({ projectRoot: testDir });

            expect(result.isError).toBe(true);
            expect(result.content[0].text).toContain("Validation failed");
        });
    });

    describe("Project Tools", () => {
        it("registers project tools", async () => {
            const server = new McpServer({ name: "test", version: "1.0.0" });
            registerProjectTools(server);

            const tools = Object.keys((server as any)._registeredTools);
            expect(tools).toContain("stackwright_get_project_info");
            expect(tools).toContain("stackwright_scaffold_project");
        });

        it("get_project_info returns project information", async () => {
            fs.writeFileSync(
                path.join(testDir, "stackwright.yml"),
                makeValidSiteConfig(),
            );
            fs.writeFileSync(
                path.join(testDir, "package.json"),
                makePackageJson("test-project"),
            );

            const server = new McpServer({ name: "test", version: "1.0.0" });
            registerProjectTools(server);

            const tool = (server as any)._registeredTools[
                "stackwright_get_project_info"
            ];
            const result = await tool.handler({ projectRoot: testDir });

            const textContent = result.content[0].text;
            expect(textContent).toContain("Project root:");
            expect(textContent).toContain("Site title:");
            expect(textContent).toContain("Test Site");
            expect(textContent).toContain("Active theme:");
            expect(textContent).toContain("per-aspera");
        });

        it("scaffold_project creates new project structure", async () => {
            const targetDir = path.join(testDir, "new-project");

            const server = new McpServer({ name: "test", version: "1.0.0" });
            registerProjectTools(server);

            const tool = (server as any)._registeredTools[
                "stackwright_scaffold_project"
            ];
            const result = await tool.handler({
                targetDir: targetDir,
                name: "my-new-site",
                title: "My New Site",
                theme: "per-aspera",
            });

            expect(result.content[0].text).toContain("Scaffolded project at:");
            expect(fs.existsSync(path.join(targetDir, "stackwright.yml"))).toBe(
                true,
            );
            expect(fs.existsSync(path.join(targetDir, "package.json"))).toBe(
                true,
            );
        });
    });

    describe("Site Tools", () => {
        it("registers site tools", async () => {
            const server = new McpServer({ name: "test", version: "1.0.0" });
            registerSiteTools(server);

            const tools = Object.keys((server as any)._registeredTools);
            expect(tools).toContain("stackwright_validate_site");
            expect(tools).toContain("stackwright_list_themes");
        });

        it("get_site_config returns site config YAML", async () => {
            const siteConfigPath = path.join(testDir, "stackwright.yml");
            fs.writeFileSync(siteConfigPath, makeValidSiteConfig());

            const server = new McpServer({ name: "test", version: "1.0.0" });
            registerSiteTools(server);

            const tool = (server as any)._registeredTools[
                "stackwright_get_site_config"
            ];
            const result = await tool.handler({ projectRoot: testDir });

            expect(result.content[0].text).toContain("Site config");
            expect(result.content[0].text).toContain("Test Site");
            expect(result.content[0].text).toContain("per-aspera");
            expect(result.isError).toBeFalsy();
        });

        it("get_site_config returns error when config missing", async () => {
            const server = new McpServer({ name: "test", version: "1.0.0" });
            registerSiteTools(server);

            const tool = (server as any)._registeredTools[
                "stackwright_get_site_config"
            ];
            const result = await tool.handler({ projectRoot: testDir });

            expect(result.isError).toBe(true);
            expect(result.content[0].text).toContain("Error reading site config");
        });

        it("validate_site returns success for valid config", async () => {
            const siteConfigPath = path.join(testDir, "stackwright.yml");
            fs.writeFileSync(siteConfigPath, makeValidSiteConfig());

            const server = new McpServer({ name: "test", version: "1.0.0" });
            registerSiteTools(server);

            const tool = (server as any)._registeredTools[
                "stackwright_validate_site"
            ];
            const result = await tool.handler({ projectRoot: testDir });

            expect(result.content[0].text).toContain("✓ Site config is valid");
            expect(result.isError).toBeFalsy();
        });

        it("list_themes returns built-in themes", async () => {
            const server = new McpServer({ name: "test", version: "1.0.0" });
            registerSiteTools(server);

            const tool = (server as any)._registeredTools[
                "stackwright_list_themes"
            ];
            const result = await tool.handler({});

            const textContent = result.content[0].text;
            expect(textContent).toContain("Built-in themes");
            expect(textContent).toMatch(/\d+/); // Should show count
            expect(textContent).toMatch(/\w+\s+—\s+\w+/); // Should contain theme entries
        });
    });

    describe("Git Ops Tools", () => {
        async function initGitRepo(dir: string): Promise<void> {
            await exec("git", ["init"], { cwd: dir });
            await exec("git", ["config", "user.email", "test@stackwright.dev"], { cwd: dir });
            await exec("git", ["config", "user.name", "Stackwright Test"], { cwd: dir });
            await exec("git", ["commit", "--allow-empty", "-m", "init"], { cwd: dir });
        }

        it("registers git ops tools", () => {
            const server = new McpServer({ name: "test", version: "1.0.0" });
            registerGitOpsTools(server);

            const tools = Object.keys((server as any)._registeredTools);
            expect(tools).toContain("stackwright_stage_changes");
            expect(tools).toContain("stackwright_open_pr");
        });

        it("stage_changes returns empty when no changes exist", async () => {
            await initGitRepo(testDir);

            const server = new McpServer({ name: "test", version: "1.0.0" });
            registerGitOpsTools(server);

            const tool = (server as any)._registeredTools["stackwright_stage_changes"];
            const result = await tool.handler({ projectRoot: testDir });

            expect(result.content[0].text).toContain("No Stackwright content changes");
        });

        it("stage_changes stages content files", async () => {
            await initGitRepo(testDir);
            const pageDir = path.join(pagesDir, "test-page");
            fs.ensureDirSync(pageDir);
            fs.writeFileSync(
                path.join(pageDir, "content.yml"),
                makePageYaml("test-page", "Test Page"),
            );

            const server = new McpServer({ name: "test", version: "1.0.0" });
            registerGitOpsTools(server);

            const tool = (server as any)._registeredTools["stackwright_stage_changes"];
            const result = await tool.handler({ projectRoot: testDir });

            expect(result.content[0].text).toContain("Staged 1 file(s)");
            expect(result.content[0].text).toContain("content/pages/test-page/content.yml");
        });

        it("open_pr returns error when nothing is staged", async () => {
            await initGitRepo(testDir);

            const server = new McpServer({ name: "test", version: "1.0.0" });
            registerGitOpsTools(server);

            const tool = (server as any)._registeredTools["stackwright_open_pr"];
            const result = await tool.handler({ projectRoot: testDir });

            expect(result.isError).toBe(true);
            expect(result.content[0].text).toContain("No staged changes");
        });
    });

    describe("Server Integration", () => {
        it("registers all tool categories", () => {
            const server = new McpServer({ name: "test", version: "1.0.0" });

            registerContentTypeTools(server);
            registerPageTools(server);
            registerProjectTools(server);
            registerSiteTools(server);
            registerGitOpsTools(server);

            const tools = Object.keys((server as any)._registeredTools);

            // Verify all expected tools are registered
            expect(tools).toContain("stackwright_get_content_types");
            expect(tools).toContain("stackwright_preview_component");
            expect(tools).toContain("stackwright_list_pages");
            expect(tools).toContain("stackwright_get_page");
            expect(tools).toContain("stackwright_write_page");
            expect(tools).toContain("stackwright_add_page");
            expect(tools).toContain("stackwright_validate_pages");
            expect(tools).toContain("stackwright_get_project_info");
            expect(tools).toContain("stackwright_scaffold_project");
            expect(tools).toContain("stackwright_get_site_config");
            expect(tools).toContain("stackwright_validate_site");
            expect(tools).toContain("stackwright_list_themes");
            expect(tools).toContain("stackwright_stage_changes");
            expect(tools).toContain("stackwright_open_pr");

            // Should have exactly 14 tools (13 from dev + preview_component)
            expect(tools.length).toBe(14);
        });
    });
});
