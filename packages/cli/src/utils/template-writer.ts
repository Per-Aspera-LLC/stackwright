import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import type { SiteConfig } from '@stackwright/types';
import type { PageContent } from '@stackwright/types';

// ---------------------------------------------------------------------------
// Version constants — update when publishing major releases
// ---------------------------------------------------------------------------

const VERSIONS = {
  emotionReact: '^11.14.0',
  emotionStyled: '^11.14.1',
  muiIconsMaterial: '^7.3.8',
  muiMaterial: '^7.3.8',
  stackwright: 'latest',
  jsYaml: '^4.1.0',
  next: '^16.0.0',
  react: '^19.0.0',
  reactDom: '^19.0.0',
  typesJsYaml: '^4.0.9',
  typesNode: '^24.0.0',
  typesReact: '^19.0.0',
  typesReactDom: '^19.0.0',
  eslint: '^9.0.0',
  eslintConfigNext: '^16.0.0',
  typescript: '^5.0.0',
} as const;

// ---------------------------------------------------------------------------
// Fixed-content templates (never vary between projects)
// ---------------------------------------------------------------------------

const NEXT_CONFIG = `const { createStackwrightNextConfig } = require("@stackwright/nextjs");

module.exports = createStackwrightNextConfig({
    transpilePackages: [
        "@stackwright/core",
        "@stackwright/nextjs",
        "@stackwright/themes",
        "@stackwright/types",
    ],
});
`;

const APP_TSX = `import type { AppProps } from "next/app";
import { registerDefaultIcons } from "@stackwright/icons";
import { registerNextJSComponents } from "@stackwright/nextjs";

// Register Next.js adapter components (Image, Link, Router, Route) and icons
registerNextJSComponents();
registerDefaultIcons();

export default function App({ Component, pageProps }: AppProps) {
    return <Component {...pageProps} />;
}
`;

const INDEX_TS = `import { DynamicPage } from "@stackwright/core";
import type { GetStaticProps } from "next";
import fs from "fs";
import path from "path";

export default DynamicPage;

export const getStaticProps: GetStaticProps = async () => {
    const dir = path.join(process.cwd(), "public", "stackwright-content");
    const pageContent = JSON.parse(fs.readFileSync(path.join(dir, "_root.json"), "utf8"));
    const siteConfig = JSON.parse(fs.readFileSync(path.join(dir, "_site.json"), "utf8"));
    return { props: { pageContent, siteConfig } };
};
`;

const SLUG_TSX = `import { DynamicPage } from "@stackwright/core";
import type { GetStaticPaths, GetStaticProps } from "next";
import fs from "fs";
import path from "path";

export default DynamicPage;

export const getStaticPaths: GetStaticPaths = async () => {
    const dir = path.join(process.cwd(), "public", "stackwright-content");
    const slugs = fs
        .readdirSync(dir)
        .filter(f => f.endsWith(".json") && f !== "_site.json" && f !== "_root.json")
        .map(f => f.replace(/\\.json$/, ""));
    return {
        paths: slugs.map(slug => ({ params: { slug } })),
        fallback: "blocking",
    };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
    const rawSlug = Array.isArray(params?.slug)
        ? params.slug.join("/")
        : (params?.slug ?? "");
    const dir = path.join(process.cwd(), "public", "stackwright-content");

    // Validate slug against known content files to prevent path traversal
    const knownSlugs = fs
        .readdirSync(dir)
        .filter(f => f.endsWith(".json") && f !== "_site.json" && f !== "_root.json")
        .map(f => f.replace(/\\.json$/, ""));
    const slug = knownSlugs.includes(rawSlug) ? rawSlug : null;

    if (!slug && rawSlug !== "") {
        return { notFound: true };
    }

    const contentFile = slug ? \`\${slug}.json\` : "_root.json";
    const pageContent = JSON.parse(fs.readFileSync(path.join(dir, contentFile), "utf8"));
    const siteConfig = JSON.parse(fs.readFileSync(path.join(dir, "_site.json"), "utf8"));
    return { props: { pageContent, siteConfig } };
};
`;

const GITIGNORE = `# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# stackwright prebuild output (generated, not committed)
/public/stackwright-content/

# misc
.DS_Store
*.pem
# Windows/WSL metadata sidecar files
*:Zone.Identifier

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
`;

const ENV_LOCAL_EXAMPLE = `# Copy this file to .env.local to configure local development options.

# Enable verbose debug logging from Stackwright internals (component registry,
# content renderer, image pipeline). Off by default — only enable when debugging.
# STACKWRIGHT_DEBUG=true
`;

// ---------------------------------------------------------------------------
// Typed object builders for YAML files
// ---------------------------------------------------------------------------

function buildSiteConfig(siteTitle: string, year: number): SiteConfig {
  return {
    title: siteTitle,
    appBar: {
      titleText: siteTitle,
      backgroundColor: 'primary',
      textColor: 'secondary',
    },
    navigation: [
      { label: 'Home', href: '/' },
      { label: 'Getting Started', href: '/getting-started' },
    ],
    footer: {
      backgroundColor: 'primary',
      textColor: 'secondary',
      copyright: `© ${year} ${siteTitle}. All rights reserved.`,
      links: [
        { label: 'GitHub', href: 'https://github.com/Per-Aspera-LLC/stackwright/' },
      ],
    },
    customTheme: {
      id: 'custom',
      name: `${siteTitle} Theme`,
      colors: {
        primary: '#1976d2',
        secondary: '#ffffff',
        accent: '#ff9800',
        background: '#fdfdfd',
        surface: '#f5f5f5',
        text: '#1a1a1a',
        textSecondary: '#666666',
      },
      typography: {
        fontFamily: {
          primary: 'Inter',
          secondary: 'Inter',
        },
        scale: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
        },
      },
      spacing: {
        xs: '0.5rem',
        sm: '0.75rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
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
            label: 'hero-section',
            heading: {
              text: `Welcome to ${siteTitle}`,
              textSize: 'h1',
              textColor: 'secondary',
            },
            textBlocks: [
              {
                text: 'Your new Stackwright site is ready. Pages are YAML files — edit pages/content.yml to update this page.',
                textSize: 'h6',
              },
              {
                text: 'Add more pages by creating subdirectories under pages/. Each directory with a content.yml becomes a route.',
                textSize: 'body1',
              },
            ],
            buttons: [
              {
                label: 'get-started-btn',
                text: 'Get Started',
                textSize: 'body1',
                variant: 'contained',
                href: '/getting-started',
                bgColor: 'secondary',
                textColor: 'primary',
                size: 'large',
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
            label: 'gs-hero',
            heading: {
              text: 'Getting Started',
              textSize: 'h1',
              textColor: 'secondary',
            },
            textBlocks: [
              {
                text: 'This page lives at pages/getting-started/content.yml. The directory name becomes the URL slug.',
                textSize: 'body1',
              },
            ],
          },
        },
        {
          main: {
            label: 'gs-add-page',
            heading: {
              text: 'Adding Pages',
              textSize: 'h2',
            },
            textBlocks: [
              {
                text: 'Use the CLI to add a new page, or create the directory and content.yml manually:',
                textSize: 'body1',
              },
            ],
            background: '#f5f5f5',
          },
        },
        {
          code_block: {
            label: 'gs-add-page-code',
            language: 'bash',
            code: 'stackwright page add my-page --heading "My New Page"',
            background: '#f5f5f5',
          },
        },
        {
          main: {
            label: 'gs-content-types',
            heading: {
              text: 'Content Types',
              textSize: 'h2',
            },
            textBlocks: [
              {
                text: 'Each entry in content_items uses a key that maps to a component: main, timeline, carousel, icon_grid, tabbed_content, code_block.',
                textSize: 'body1',
              },
            ],
          },
        },
        {
          main: {
            label: 'gs-theme',
            heading: {
              text: 'Customizing the Theme',
              textSize: 'h2',
            },
            textBlocks: [
              {
                text: 'Edit the customTheme block in stackwright.yml to change colors and typography across every page instantly.',
                textSize: 'body1',
              },
            ],
            background: '#f5f5f5',
          },
        },
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// Structured data builders for JSON files
// ---------------------------------------------------------------------------

function buildPackageJson(projectName: string): object {
  return {
    name: projectName,
    version: '0.1.0',
    private: true,
    scripts: {
      prebuild: 'stackwright-prebuild',
      predev: 'stackwright-prebuild',
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
      'type-check': 'tsc --noEmit',
    },
    dependencies: {
      '@emotion/react': VERSIONS.emotionReact,
      '@emotion/styled': VERSIONS.emotionStyled,
      '@mui/icons-material': VERSIONS.muiIconsMaterial,
      '@mui/material': VERSIONS.muiMaterial,
      '@stackwright/core': VERSIONS.stackwright,
      '@stackwright/icons': VERSIONS.stackwright,
      '@stackwright/nextjs': VERSIONS.stackwright,
      'js-yaml': VERSIONS.jsYaml,
      next: VERSIONS.next,
      react: VERSIONS.react,
      'react-dom': VERSIONS.reactDom,
    },
    devDependencies: {
      '@stackwright/build-scripts': VERSIONS.stackwright,
      '@types/js-yaml': VERSIONS.typesJsYaml,
      '@types/node': VERSIONS.typesNode,
      '@types/react': VERSIONS.typesReact,
      '@types/react-dom': VERSIONS.typesReactDom,
      eslint: VERSIONS.eslint,
      'eslint-config-next': VERSIONS.eslintConfigNext,
      typescript: VERSIONS.typescript,
    },
    engines: {
      node: '>=20.0.0',
      pnpm: '>=10.0.0',
    },
    packageManager: 'pnpm@10.0.0',
  };
}

function buildTsConfig(): object {
  return {
    compilerOptions: {
      target: 'es2022',
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'react-jsx',
      incremental: true,
      plugins: [{ name: 'next' }],
      paths: { '@/*': ['./src/*'] },
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules'],
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ScaffoldConfig {
  projectName: string;
  siteTitle: string;
  themeId: string;
  targetDir: string;
}

/**
 * Writes all scaffold template files to targetDir.
 * Returns a list of written paths relative to targetDir.
 */
export async function writeScaffold(config: ScaffoldConfig): Promise<string[]> {
  const { projectName, siteTitle, targetDir } = config;
  const written: string[] = [];
  const year = new Date().getFullYear();

  async function write(relPath: string, content: string): Promise<void> {
    const fullPath = path.join(targetDir, relPath);
    await fs.ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, content, 'utf8');
    written.push(relPath);
  }

  await write('package.json', JSON.stringify(buildPackageJson(projectName), null, 2) + '\n');
  await write('next.config.js', NEXT_CONFIG);
  await write('tsconfig.json', JSON.stringify(buildTsConfig(), null, 2) + '\n');
  await write('.gitignore', GITIGNORE);
  await write('.env.local.example', ENV_LOCAL_EXAMPLE);
  await write('stackwright.yml', yaml.dump(buildSiteConfig(siteTitle, year), { lineWidth: 120 }));
  await write('pages/_app.tsx', APP_TSX);
  await write('pages/index.ts', INDEX_TS);
  await write('pages/[slug].tsx', SLUG_TSX);
  await write('pages/content.yml', yaml.dump(buildRootPageContent(siteTitle), { lineWidth: 120 }));
  await write('pages/getting-started/content.yml', yaml.dump(buildGettingStartedPageContent(), { lineWidth: 120 }));

  return written;
}
