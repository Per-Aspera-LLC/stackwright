import fs from 'fs-extra';
import path from 'path';

// Version constants for scaffolded project dependencies.
// Update these when publishing major releases.
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
};

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

  await write('package.json', packageJsonTemplate(projectName));
  await write('next.config.js', nextConfigTemplate());
  await write('tsconfig.json', tsconfigTemplate());
  await write('.gitignore', gitignoreTemplate());
  await write('.env.local.example', envLocalExampleTemplate());
  await write('stackwright.yml', stackwrightYmlTemplate(siteTitle, themeId, year));
  await write('pages/_app.tsx', appTsxTemplate());
  await write('pages/index.ts', indexTsTemplate());
  await write('pages/[slug].tsx', slugTsxTemplate());
  await write('pages/content.yml', rootContentYmlTemplate(siteTitle));

  return written;
}

function packageJsonTemplate(projectName: string): string {
  return JSON.stringify(
    {
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
    },
    null,
    2
  );
}

function nextConfigTemplate(): string {
  return `const { createStackwrightNextConfig } = require("@stackwright/nextjs");

module.exports = createStackwrightNextConfig({
    transpilePackages: [
        "@stackwright/core",
        "@stackwright/nextjs",
        "@stackwright/themes",
        "@stackwright/types",
    ],
});
`;
}

function tsconfigTemplate(): string {
  return JSON.stringify(
    {
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
    },
    null,
    2
  );
}

function gitignoreTemplate(): string {
  return `# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

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
}

function envLocalExampleTemplate(): string {
  return `# Stackwright debug mode — set to "true" to enable verbose logging from
# component registry, content renderer, and image pipeline.
# STACKWRIGHT_DEBUG=true
`;
}

function stackwrightYmlTemplate(siteTitle: string, themeId: string, year: number): string {
  return `title: "${siteTitle}"

appBar:
  titleText: "${siteTitle}"
  backgroundColor: "primary"
  textColor: "secondary"

navigation:
  - label: "Home"
    href: "/"

footer:
  backgroundColor: "primary"
  textColor: "secondary"
  copyright: "© ${year} ${siteTitle}. All rights reserved."

themeName: "${themeId}"
`;
}

function appTsxTemplate(): string {
  return `import type { AppProps } from "next/app";
import { registerDefaultIcons } from "@stackwright/icons";
import { registerNextJSComponents } from "@stackwright/nextjs";

// Register Next.js adapter components (Image, Link, Router, Route) and icons
registerNextJSComponents();
registerDefaultIcons();

export default function App({ Component, pageProps }: AppProps) {
    return <Component {...pageProps} />;
}
`;
}

function indexTsTemplate(): string {
  return `import { DynamicPage } from "@stackwright/core";
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
}

function slugTsxTemplate(): string {
  return `import { DynamicPage } from "@stackwright/core";
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
}

function rootContentYmlTemplate(siteTitle: string): string {
  return `content:
  content_items:
    - main:
        label: "hero-section"
        heading:
          text: "Welcome to ${siteTitle}"
          textSize: "h1"
          textColor: "secondary"
        textBlocks:
          - text: "Your new Stackwright site is ready. Edit pages/content.yml to get started."
            textSize: "h6"
`;
}
