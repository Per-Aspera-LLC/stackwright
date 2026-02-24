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
  muiIconsMaterial: '^7.3.0',
  muiMaterial: '^7.3.0',
  stackwright: 'latest',
  jsYaml: '^4.1.0',
  next: '^16.0.0',
  react: '^19.0.0',
  reactDom: '^19.0.0',
  typesJsYaml: '^4.0.0',
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
    const slug = Array.isArray(params?.slug)
        ? params.slug.join("/")
        : (params?.slug ?? "");
    const dir = path.join(process.cwd(), "public", "stackwright-content");
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

const ENV_LOCAL_EXAMPLE = `# Stackwright debug mode — set to "true" to enable verbose logging from
# component registry, content renderer, and image pipeline.
# STACKWRIGHT_DEBUG=true
`;

// ---------------------------------------------------------------------------
// Typed object builders for YAML files
// ---------------------------------------------------------------------------

function buildSiteConfig(siteTitle: string, themeId: string, year: number): SiteConfig {
  return {
    title: siteTitle,
    appBar: {
      titleText: siteTitle,
      backgroundColor: 'primary',
      textColor: 'secondary',
    },
    navigation: [
      { label: 'Home', href: '/' },
    ],
    footer: {
      backgroundColor: 'primary',
      textColor: 'secondary',
      copyright: `© ${year} ${siteTitle}. All rights reserved.`,
    },
    themeName: themeId,
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
                text: 'Your new Stackwright site is ready. Edit pages/content.yml to get started.',
                textSize: 'body1',
              },
            ],
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
    },
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
  const { projectName, siteTitle, themeId, targetDir } = config;
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
  await write('stackwright.yml', yaml.dump(buildSiteConfig(siteTitle, themeId, year), { lineWidth: 120 }));
  await write('pages/_app.tsx', APP_TSX);
  await write('pages/index.ts', INDEX_TS);
  await write('pages/[slug].tsx', SLUG_TSX);
  await write('pages/content.yml', yaml.dump(buildRootPageContent(siteTitle), { lineWidth: 120 }));

  return written;
}
