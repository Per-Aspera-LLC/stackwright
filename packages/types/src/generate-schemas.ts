import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import * as TJS from 'typescript-json-schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateSchemas() {
  console.log('🔧 Generating JSON Schemas...');
  
  const settings: TJS.PartialArgs = {
    required: true,
    noExtraProps: true,
    propOrder: false,
    typeOfKeyword: false,
    titles: false,
    defaultProps: false,
    ref: true,
    aliasRef: false,
    topRef: false,
    id: "",
    defaultNumberType: "number",
    tsNodeRegister: false,
    validationKeywords: [],
    include: [],
    ignoreErrors: false,
    excludePrivate: false,
    uniqueNames: false,
    rejectDateType: false,
    skipLibCheck: true,
  };

  const compilerOptions: TJS.CompilerOptions = {
    strictNullChecks: true,
    esModuleInterop: true,
    target: 9, // Equivalent to ts.ScriptTarget.ES2022
    module: 99 // Equivalent to ts.ModuleKind.ESNext

  };

  const program = TJS.getProgramFromFiles(
    [path.resolve(__dirname, './types/index.ts')],
    compilerOptions
  );

  const generator = TJS.buildGenerator(program, settings);
  
  if (!generator) {
    throw new Error('Failed to create schema generator');
  }

  // Generate schema for main content structure
  const contentSchema = generator.getSchemaForSymbol('PageContent');
  
  if (!contentSchema) {
    throw new Error('Could not generate schema for PageContent');
  }

  const outputDir = path.join(__dirname, '../dist/schemas');
  await fs.ensureDir(outputDir);
  
  await fs.writeJSON(
    path.join(outputDir, 'content-schema.json'),
    contentSchema,
    { spaces: 2 }
  );
  
  console.log('✅ Generated schemas in dist/schemas/');
}

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateSchemas().catch(console.error);
}