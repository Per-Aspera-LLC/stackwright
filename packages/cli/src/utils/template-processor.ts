import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import type { SiteConfig } from '@stackwright/types';
import type { PageContent } from '@stackwright/types';
import { siteConfigSchema, pageContentSchema } from './schema-loader';
import { generateDefaults } from './schema-defaults';
import { getSiteConfigHints, getRootPageHints, getGettingStartedHints } from './scaffold-hints';
import { fetchTemplate } from './template-fetcher';

/**
 * Walk up from the given directory looking for a pnpm-workspace.yaml.
 * Returns the monorepo root path if found, null otherwise.
 */
function detectMonorepoRoot(startDir: string): string | null {
  let dir = path.resolve(startDir);
  while (true) {
    if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null; // reached filesystem root
    dir = parent;
  }
}

// ---------------------------------------------------------------------------
// Template Processing
// ---------------------------------------------------------------------------

export interface TemplateConfig {
  projectName: string;
  siteTitle: string;
  themeId: string;
  targetDir: string;
  /** Skip network fetch and use bundled templates only. */
  offline?: boolean;
  /** Force workspace:* dependencies for monorepo usage. */
  monorepo?: boolean;
  /** Force versioned dependencies for standalone usage (overrides auto-detection). */
  standalone?: boolean;
}

/**
 * Processes template files from the GitHub template repo (with bundled fallback)
 * and generates dynamic content via Zod schema introspection.
 */
export async function processTemplate(config: TemplateConfig): Promise<string[]> {
  const { projectName, siteTitle, themeId, targetDir, offline } = config;
  const written: string[] = [];
  const year = new Date().getFullYear();

  // Fetch static template files from GitHub repo (falls back to bundled copy)
  const { source } = await fetchTemplate(targetDir, { offline });

  // Collect template files that were fetched (excluding README which is repo-only)
  const templateFiles = await collectFiles(targetDir);

  // Apply placeholder substitution to all fetched text files
  for (const relPath of templateFiles) {
    const fullPath = path.join(targetDir, relPath);
    const content = await fs.readFile(fullPath, 'utf8');
    const processed = content
      .replace(/{{projectName}}/g, projectName)
      .replace(/{{siteTitle}}/g, siteTitle)
      .replace(/{{year}}/g, year.toString());
    await fs.writeFile(fullPath, processed, 'utf8');
    written.push(relPath);
  }

  // Remove README.md from the template repo (it's for the template, not the project)
  const readmePath = path.join(targetDir, 'README.md');
  if (fs.existsSync(readmePath)) {
    await fs.remove(readmePath);
  }

  async function processYamlFile(relPath: string, data: SiteConfig | PageContent): Promise<void> {
    const fullPath = path.join(targetDir, relPath);
    await fs.ensureDir(path.dirname(fullPath));
    const yamlContent = yaml.dump(data, { lineWidth: 120 });
    await fs.writeFile(fullPath, yamlContent, 'utf8');
    written.push(relPath);
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

  // Determine dependency mode: explicit flags override auto-detection
  let useWorkspaceDeps = false;
  if (config.standalone) {
    useWorkspaceDeps = false;
  } else if (config.monorepo) {
    useWorkspaceDeps = true;
  } else {
    // Auto-detect: if scaffolding inside a pnpm workspace, use workspace deps
    useWorkspaceDeps = detectMonorepoRoot(targetDir) !== null;
  }

  // Generate package.json with proper formatting
  const packageJsonPath = path.join(targetDir, 'package.json');
  await fs.ensureDir(path.dirname(packageJsonPath));
  await fs.writeFile(
    packageJsonPath,
    JSON.stringify(buildPackageJson(projectName, useWorkspaceDeps), null, 2) + '\n',
    'utf8'
  );
  written.push('package.json');

  // Generate tsconfig.json
  const tsconfigPath = path.join(targetDir, 'tsconfig.json');
  await fs.writeFile(tsconfigPath, JSON.stringify(buildTsConfig(), null, 2) + '\n', 'utf8');
  written.push('tsconfig.json');

  return written;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Recursively collect all file paths relative to dir, excluding .git */
async function collectFiles(dir: string, base: string = ''): Promise<string[]> {
  const results: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'README.md') continue;
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results.push(...(await collectFiles(path.join(dir, entry.name), rel)));
    } else {
      results.push(rel);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Non-schema builders (npm/TypeScript config — not Stackwright grammar)
// ---------------------------------------------------------------------------

function buildPackageJson(projectName: string, useWorkspaceDeps: boolean = false): object {
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

  const sw = useWorkspaceDeps ? 'workspace:*' : VERSIONS.stackwright;

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
      '@stackwright/ui-shadcn': sw,
      '@stackwright/core': sw,
      '@stackwright/icons': sw,
      '@stackwright/nextjs': sw,
      'js-yaml': VERSIONS.jsYaml,
      next: VERSIONS.next,
      react: VERSIONS.react,
      'react-dom': VERSIONS.reactDom,
    },
    devDependencies: {
      '@stackwright/build-scripts': sw,
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
