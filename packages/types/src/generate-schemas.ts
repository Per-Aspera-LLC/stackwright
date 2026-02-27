import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { pageContentSchema } from './types/layout';
import { siteConfigSchema } from './types/siteConfig';
import { themeConfigSchema } from '@stackwright/themes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateSchemas() {
  console.log('🔧 Generating JSON Schemas...');

  const contentSchema = zodToJsonSchema(pageContentSchema, {
    name: 'PageContent',
    $refStrategy: 'none',
  });

  const themeSchema = zodToJsonSchema(themeConfigSchema, {
    name: 'ThemeConfig',
    $refStrategy: 'none',
  });

  const siteSchema = zodToJsonSchema(siteConfigSchema, {
    name: 'SiteConfig',
    $refStrategy: 'none',
  });

  const outputDir = path.join(__dirname, '../dist/schemas');
  await fs.ensureDir(outputDir);

  await fs.writeJSON(
    path.join(outputDir, 'content-schema.json'),
    contentSchema,
    { spaces: 2 }
  );

  await fs.writeJSON(
    path.join(outputDir, 'theme-schema.json'),
    themeSchema,
    { spaces: 2 }
  );

  await fs.writeJSON(
    path.join(outputDir, 'site-config-schema.json'),
    siteSchema,
    { spaces: 2 }
  );

  console.log('✅ Generated schemas in dist/schemas/');
}

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateSchemas().catch(console.error);
}
