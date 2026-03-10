import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import type { SiteConfig } from '@stackwright/types';
import type { PageContent } from '@stackwright/types';
import { siteConfigSchema, pageContentSchema } from './schema-loader';
import { generateDefaults } from './schema-defaults';
import {
  getSiteConfigHints,
  getRootPageHints,
  getGettingStartedHints,
} from './scaffold-hints';

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
export async function processTemplate(config: TemplateConfig): Promise<string[]> {
  const { projectName, siteTitle, themeId, targetDir } = config;
  const written: string[] = [];
  const year = new Date().getFullYear();

  // Path to template directory.
  // tsup bundles to dist/cli.js (flat), so __dirname = packages/cli/dist at runtime.
  // Templates live at packages/cli/templates/scaffold-template — one level up from dist.
  const templateDir = path.join(__dirname, '..', 'templates', 'scaffold-template');

  async function processFile(relPath: string, content: string): Promise<void> {
    const fullPath = path.join(targetDir, relPath);
    await fs.ensureDir(path.dirname(fullPath));

    // Replace placeholders
    const processedContent = content
      .replace(/{{projectName}}/g, projectName)
      .replace(/{{siteTitle}}/g, siteTitle)
      .replace(/{{year}}/g, year.toString());

    await fs.writeFile(fullPath, processedContent, 'utf8');
    written.push(relPath);
  }

  async function processYamlFile(relPath: string, data: SiteConfig | PageContent): Promise<void> {
    const fullPath = path.join(targetDir, relPath);
    await fs.ensureDir(path.dirname(fullPath));
    const yamlContent = yaml.dump(data, { lineWidth: 120 });
    await fs.writeFile(fullPath, yamlContent, 'utf8');
    written.push(relPath);
  }

  // Copy static template files
  const staticFiles = [
    '.gitignore',
    '.env.local.example',
    'next.config.js',
    'pages/_app.tsx',
    'pages/index.ts',
    'pages/[slug].tsx',
    '.vscode/settings.json',
  ];

  for (const file of staticFiles) {
    const templatePath = path.join(templateDir, file);
    if (!fs.existsSync(templatePath)) {
      throw new Error(
        `Template file missing: ${templatePath}\n` +
          `This is a packaging error — please reinstall @stackwright/cli.`
      );
    }
    const content = await fs.readFile(templatePath, 'utf8');
    await processFile(file, content);
  }

  // Generate dynamic files via schema introspection + hints
  const siteConfig = generateDefaults(
    siteConfigSchema as any,
    getSiteConfigHints(siteTitle, themeId, year)
  ) as SiteConfig;
  await processYamlFile('stackwright.yml', siteConfig);

  const rootPage = generateDefaults(
    pageContentSchema as any,
    getRootPageHints(siteTitle)
  ) as PageContent;
  await processYamlFile('pages/content.yml', rootPage);

  const gettingStartedPage = generateDefaults(
    pageContentSchema as any,
    getGettingStartedHints()
  ) as PageContent;
  await processYamlFile('pages/getting-started/content.yml', gettingStartedPage);

  // Generate package.json with proper formatting
  const packageJsonContent = JSON.stringify(buildPackageJson(projectName), null, 2) + '\n';
  await processFile('package.json', packageJsonContent);

  // Generate tsconfig.json
  const tsconfigContent = JSON.stringify(buildTsConfig(), null, 2) + '\n';
  await processFile('tsconfig.json', tsconfigContent);

  return written;
}

// ---------------------------------------------------------------------------
// Non-schema builders (npm/TypeScript config — not Stackwright grammar)
// ---------------------------------------------------------------------------

function buildPackageJson(projectName: string): object {
  // MAINTENANCE: Update these versions when cutting major releases of Stackwright.
  const VERSIONS = {
    tailwindcss: '^4.1.11',
    stackwright: 'latest',
    jsYaml: '^4.1.1',
    next: '^16.1.6',
    react: '^19.2.4',
    reactDom: '^19.2.4',
    typesJsYaml: '^4.0.9',
    typesNode: '^24.10.13',
    typesReact: '^19.2.14',
    typesReactDom: '^19.2.3',
    eslint: '^9.39.2',
    eslintConfigNext: '^16.1.6',
    typescript: '^5.9.3',
  };

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
      '@stackwright/ui-shadcn': VERSIONS.stackwright,
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
    packageManager: 'pnpm@10',
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
