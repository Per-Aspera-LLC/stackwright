import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { pageContentSchema } from './types/layout';
import { siteConfigSchema } from './types/siteConfig';
import { themeConfigSchema } from '@stackwright/themes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JSON_SCHEMA_OPTIONS = { reused: 'ref', target: 'draft-7' } as const;

export async function generateSchemas() {
  console.log('🔧 Generating JSON Schemas...');

  const contentSchema = z.toJSONSchema(pageContentSchema, JSON_SCHEMA_OPTIONS);
  const themeSchema = z.toJSONSchema(themeConfigSchema, JSON_SCHEMA_OPTIONS);
  const siteSchema = z.toJSONSchema(siteConfigSchema, JSON_SCHEMA_OPTIONS);

  const outputDir = path.join(__dirname, '../schemas');
  await fs.ensureDir(outputDir);

  await fs.writeJSON(path.join(outputDir, 'content-schema.json'), contentSchema, { spaces: 2 });

  await fs.writeJSON(path.join(outputDir, 'theme-schema.json'), themeSchema, { spaces: 2 });

  await fs.writeJSON(path.join(outputDir, 'site-config-schema.json'), siteSchema, { spaces: 2 });

  console.log('✅ Generated schemas in schemas/');
}

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateSchemas().catch(console.error);
}
