import fs from "fs-extra";
import path from "path";
import yaml from "js-yaml";
import type { SiteConfig } from "@stackwright/types";
import type { PageContent } from "@stackwright/types";

// ---------------------------------------------------------------------------
// Template Processing
// ---------------------------------------------------------------------------

export interface TemplateConfig {
    projectName: string;
    siteTitle: string;
    themeId: string;
    targetDir: string;
}

/**
 * Processes template files by copying from template directory and replacing placeholders
 */
export async function processTemplate(
    config: TemplateConfig,
): Promise<string[]> {
    const { projectName, siteTitle, themeId, targetDir } = config;
    const written: string[] = [];
    const year = new Date().getFullYear();

    // Path to template directory.
    // tsup bundles to dist/cli.js (flat), so __dirname = packages/cli/dist at runtime.
    // Templates live at packages/cli/templates/scaffold-template — one level up from dist.
    const templateDir = path.join(__dirname, "..", "templates", "scaffold-template");

    async function processFile(
        relPath: string,
        content: string,
    ): Promise<void> {
        const fullPath = path.join(targetDir, relPath);
        await fs.ensureDir(path.dirname(fullPath));

        // Replace placeholders
        const processedContent = content
            .replace(/{{projectName}}/g, projectName)
            .replace(/{{siteTitle}}/g, siteTitle)
            .replace(/{{year}}/g, year.toString());

        await fs.writeFile(fullPath, processedContent, "utf8");
        written.push(relPath);
    }

    async function processYamlFile(relPath: string, data: SiteConfig | PageContent): Promise<void> {
        const fullPath = path.join(targetDir, relPath);
        await fs.ensureDir(path.dirname(fullPath));
        const yamlContent = yaml.dump(data, { lineWidth: 120 });
        await fs.writeFile(fullPath, yamlContent, "utf8");
        written.push(relPath);
    }

    // Copy static template files
    const staticFiles = [
        ".gitignore",
        ".env.local.example",
        "next.config.js",
        "pages/_app.tsx",
        "pages/index.ts",
        "pages/[slug].tsx",
        ".vscode/settings.json",
    ];

    for (const file of staticFiles) {
        const templatePath = path.join(templateDir, file);
        if (!fs.existsSync(templatePath)) {
            throw new Error(
                `Template file missing: ${templatePath}\n` +
                `This is a packaging error — please reinstall @stackwright/cli.`,
            );
        }
        const content = await fs.readFile(templatePath, "utf8");
        await processFile(file, content);
    }

    // Generate dynamic files
    await processYamlFile("stackwright.yml", buildSiteConfig(siteTitle, themeId, year));
    await processYamlFile("pages/content.yml", buildRootPageContent(siteTitle));
    await processYamlFile(
        "pages/getting-started/content.yml",
        buildGettingStartedPageContent(),
    );

    // Generate package.json with proper formatting
    const packageJsonContent =
        JSON.stringify(buildPackageJson(projectName), null, 2) + "\n";
    await processFile("package.json", packageJsonContent);

    // Generate tsconfig.json
    const tsconfigContent = JSON.stringify(buildTsConfig(), null, 2) + "\n";
    await processFile("tsconfig.json", tsconfigContent);

    return written;
}

// ---------------------------------------------------------------------------
// Dynamic content builders (same as before but can be enhanced)
// ---------------------------------------------------------------------------

function buildSiteConfig(siteTitle: string, themeId: string, year: number): SiteConfig {
    return {
        title: siteTitle,
        themeName: themeId,
        appBar: {
            titleText: siteTitle,
            backgroundColor: "primary",
            textColor: "secondary",
        },
        navigation: [
            { label: "Home", href: "/" },
            { label: "Getting Started", href: "/getting-started" },
        ],
        footer: {
            backgroundColor: "primary",
            textColor: "secondary",
            copyright: `© ${year} ${siteTitle}. All rights reserved.`,
            links: [],
        },
        customTheme: {
            id: "custom",
            name: `${siteTitle} Theme`,
            colors: {
                primary: "#1976d2",
                secondary: "#ffffff",
                accent: "#ff9800",
                background: "#fdfdfd",
                surface: "#f5f5f5",
                text: "#1a1a1a",
                textSecondary: "#666666",
            },
            typography: {
                fontFamily: {
                    primary: "Inter",
                    secondary: "Inter",
                },
                scale: {
                    xs: "0.75rem",
                    sm: "0.875rem",
                    base: "1rem",
                    lg: "1.125rem",
                    xl: "1.25rem",
                    "2xl": "1.5rem",
                    "3xl": "1.875rem",
                },
            },
            spacing: {
                xs: "0.5rem",
                sm: "0.75rem",
                md: "1rem",
                lg: "1.5rem",
                xl: "2rem",
                "2xl": "3rem",
            },
        },
    };
}

function buildRootPageContent(siteTitle: string): PageContent {
    return {
        content: {
            content_items: [
                {
                    main: {
                        label: "hero-section",
                        heading: {
                            text: `Welcome to ${siteTitle}`,
                            textSize: "h1",
                            textColor: "secondary",
                        },
                        textBlocks: [
                            {
                                text: "Your new Stackwright site is ready. Pages are YAML files — edit pages/content.yml to update this page.",
                                textSize: "h6",
                            },
                            {
                                text: "Add more pages by creating subdirectories under pages/. Each directory with a content.yml becomes a route.",
                                textSize: "body1",
                            },
                        ],
                        buttons: [
                            {
                                label: "get-started-btn",
                                text: "Get Started",
                                textSize: "body1",
                                variant: "contained",
                                href: "/getting-started",
                                bgColor: "secondary",
                                textColor: "primary",
                                size: "large",
                            },
                        ],
                    },
                },
            ],
        },
    };
}

function buildGettingStartedPageContent(): PageContent {
    return {
        content: {
            content_items: [
                {
                    main: {
                        label: "gs-hero",
                        heading: {
                            text: "Getting Started",
                            textSize: "h1",
                            textColor: "secondary",
                        },
                        textBlocks: [
                            {
                                text: "This page lives at pages/getting-started/content.yml. The directory name becomes the URL slug.",
                                textSize: "body1",
                            },
                        ],
                    },
                },
                {
                    main: {
                        label: "gs-add-page",
                        heading: {
                            text: "Adding Pages",
                            textSize: "h2",
                        },
                        textBlocks: [
                            {
                                text: "Use the CLI to add a new page, or create the directory and content.yml manually:",
                                textSize: "body1",
                            },
                        ],
                        background: "#f5f5f5",
                    },
                },
                {
                    code_block: {
                        label: "gs-add-page-code",
                        language: "bash",
                        code: 'stackwright page add my-page --heading "My New Page"',
                        background: "#f5f5f5",
                    },
                },
                {
                    main: {
                        label: "gs-content-types",
                        heading: {
                            text: "Content Types",
                            textSize: "h2",
                        },
                        textBlocks: [
                            {
                                text: "Each entry in content_items uses a key that maps to a component: main, timeline, carousel, icon_grid, tabbed_content, code_block.",
                                textSize: "body1",
                            },
                        ],
                    },
                },
                {
                    main: {
                        label: "gs-theme",
                        heading: {
                            text: "Customizing the Theme",
                            textSize: "h2",
                        },
                        textBlocks: [
                            {
                                text: "Edit the customTheme block in stackwright.yml to change colors and typography across every page instantly.",
                                textSize: "body1",
                            },
                        ],
                        background: "#f5f5f5",
                    },
                },
            ],
        },
    };
}

function buildPackageJson(projectName: string): object {
    // MAINTENANCE: Update these versions when cutting major releases of Stackwright.
    const VERSIONS = {
        emotionReact: "^11.14.0",
        emotionStyled: "^11.14.1",
        muiIconsMaterial: "^7.3.8",
        muiMaterial: "^7.3.8",
        stackwright: "latest",
        jsYaml: "^4.1.1",
        next: "^16.1.6",
        react: "^19.2.4",
        reactDom: "^19.2.4",
        typesJsYaml: "^4.0.9",
        typesNode: "^24.10.13",
        typesReact: "^19.2.14",
        typesReactDom: "^19.2.3",
        eslint: "^9.39.2",
        eslintConfigNext: "^16.1.6",
        typescript: "^5.9.3",
    };

    return {
        name: projectName,
        version: "0.1.0",
        private: true,
        scripts: {
            prebuild: "stackwright-prebuild",
            predev: "stackwright-prebuild",
            dev: "next dev",
            build: "next build",
            start: "next start",
            lint: "next lint",
            "type-check": "tsc --noEmit",
        },
        dependencies: {
            "@emotion/react": VERSIONS.emotionReact,
            "@emotion/styled": VERSIONS.emotionStyled,
            "@mui/icons-material": VERSIONS.muiIconsMaterial,
            "@mui/material": VERSIONS.muiMaterial,
            "@stackwright/core": VERSIONS.stackwright,
            "@stackwright/icons": VERSIONS.stackwright,
            "@stackwright/nextjs": VERSIONS.stackwright,
            "js-yaml": VERSIONS.jsYaml,
            next: VERSIONS.next,
            react: VERSIONS.react,
            "react-dom": VERSIONS.reactDom,
        },
        devDependencies: {
            "@stackwright/build-scripts": VERSIONS.stackwright,
            "@types/js-yaml": VERSIONS.typesJsYaml,
            "@types/node": VERSIONS.typesNode,
            "@types/react": VERSIONS.typesReact,
            "@types/react-dom": VERSIONS.typesReactDom,
            eslint: VERSIONS.eslint,
            "eslint-config-next": VERSIONS.eslintConfigNext,
            typescript: VERSIONS.typescript,
        },
        engines: {
            node: ">=20.0.0",
            pnpm: ">=10.0.0",
        },
        packageManager: "pnpm@10",
    };
}

function buildTsConfig(): object {
    return {
        compilerOptions: {
            target: "es2022",
            lib: ["dom", "dom.iterable", "esnext"],
            allowJs: true,
            skipLibCheck: true,
            strict: true,
            forceConsistentCasingInFileNames: true,
            noEmit: true,
            esModuleInterop: true,
            module: "esnext",
            moduleResolution: "bundler",
            resolveJsonModule: true,
            isolatedModules: true,
            jsx: "react-jsx",
            incremental: true,
            plugins: [{ name: "next" }],
            paths: { "@/*": ["./src/*"] },
        },
        include: [
            "next-env.d.ts",
            "**/*.ts",
            "**/*.tsx",
            ".next/types/**/*.ts",
        ],
        exclude: ["node_modules"],
    };
}
