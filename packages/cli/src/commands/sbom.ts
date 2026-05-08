import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import {
  createSBOM,
  validateSPDX,
  validateCycloneDX,
  validateBuildManifest,
} from '@stackwright/sbom-generator';
import { outputResult, outputError } from '../utils/json-output';

/**
 * SBOM CLI Command
 *
 * Provides subcommands for:
 * - generate: Run SBOM generation
 * - validate: Validate existing SBOM files
 * - diff: Compare two SBOMs
 */

// --------------------------------------------------------------------------
// SBOM Generation
// --------------------------------------------------------------------------

export interface SBOMGenerateOptions {
  projectRoot?: string;
  formats?: string[];
  includeDevDependencies?: boolean;
  includePeerDependencies?: boolean;
  outputDir?: string;
}

export interface SBOMGenerateResult {
  success: boolean;
  outputDir: string;
  files: string[];
}

async function generateSBOM(options: SBOMGenerateOptions = {}): Promise<SBOMGenerateResult> {
  const projectRoot = options.projectRoot ?? process.cwd();

  const formats = (options.formats as ('spdx' | 'cyclonedx' | 'build-manifest')[]) ?? [
    'spdx',
    'cyclonedx',
    'build-manifest',
  ];

  const sbom = await createSBOM({
    projectRoot,
    formats,
    includeDevDependencies: options.includeDevDependencies ?? false,
    includePeerDependencies: options.includePeerDependencies ?? true,
    outputDir: options.outputDir ?? path.join(projectRoot, '.stackwright', 'sbom'),
  });

  await sbom.writeTo(projectRoot);

  const outputDir = path.join(projectRoot, '.stackwright', 'sbom');
  const files = fs.existsSync(outputDir)
    ? fs.readdirSync(outputDir).map((f) => path.join(outputDir, f))
    : [];

  return {
    success: true,
    outputDir,
    files,
  };
}

// --------------------------------------------------------------------------
// SBOM Validation
// --------------------------------------------------------------------------

export interface SBOMValidateOptions {
  inputFile: string;
}

export interface SBOMValidateResult {
  valid: boolean;
  format: string | null;
  errors: string[];
}

async function validateSBOM(options: SBOMValidateOptions): Promise<SBOMValidateResult> {
  const inputPath = path.resolve(options.inputFile);

  if (!fs.existsSync(inputPath)) {
    return {
      valid: false,
      format: null,
      errors: [`File not found: ${inputPath}`],
    };
  }

  const content = fs.readFileSync(inputPath, 'utf8');
  const errors: string[] = [];

  // Try SPDX first
  const spdxResult = validateSPDX(content);
  if (spdxResult.valid) {
    return { valid: true, format: 'SPDX', errors: [] };
  }

  // Try CycloneDX
  const cyclonedxResult = validateCycloneDX(content);
  if (cyclonedxResult.valid) {
    return { valid: true, format: 'CycloneDX', errors: [] };
  }

  // Try Build Manifest
  const manifestResult = validateBuildManifest(content);
  if (manifestResult.valid) {
    return { valid: true, format: 'Build Manifest', errors: [] };
  }

  // Combine errors from all validators
  errors.push(...spdxResult.errors.map((e) => `SPDX: ${e}`));
  errors.push(...cyclonedxResult.errors.map((e) => `CycloneDX: ${e}`));
  errors.push(...manifestResult.errors.map((e) => `Build Manifest: ${e}`));

  return {
    valid: false,
    format: null,
    errors: errors.length > 0 ? errors : ['Unable to identify SBOM format'],
  };
}

// --------------------------------------------------------------------------
// SBOM Diff
// --------------------------------------------------------------------------

export interface SBOMDiffOptions {
  oldFile: string;
  newFile: string;
}

export interface SBOMDiffResult {
  added: string[];
  removed: string[];
  changed: string[];
}

async function diffSBOM(options: SBOMDiffOptions): Promise<SBOMDiffResult> {
  const oldPath = path.resolve(options.oldFile);
  const newPath = path.resolve(options.newFile);

  if (!fs.existsSync(oldPath)) {
    throw new Error(`Old SBOM file not found: ${oldPath}`);
  }
  if (!fs.existsSync(newPath)) {
    throw new Error(`New SBOM file not found: ${newPath}`);
  }

  const oldContent = JSON.parse(fs.readFileSync(oldPath, 'utf8'));
  const newContent = JSON.parse(fs.readFileSync(newPath, 'utf8'));

  const oldPackages = new Set(
    (oldContent.packages ?? oldContent.components ?? []).map((p: any) => p.name)
  );
  const newPackages = new Set(
    (newContent.packages ?? newContent.components ?? []).map((p: any) => p.name)
  );

  const added: string[] = [];
  const removed: string[] = [];

  for (const pkg of newPackages) {
    if (!oldPackages.has(pkg)) {
      added.push(pkg);
    }
  }

  for (const pkg of oldPackages) {
    if (!newPackages.has(pkg)) {
      removed.push(pkg);
    }
  }

  // Check for version changes in common packages
  const changed: string[] = [];
  const oldPackagesMap = new Map(
    (oldContent.packages ?? oldContent.components ?? []).map((p: any) => [p.name, p])
  );
  const newPackagesMap = new Map(
    (newContent.packages ?? newContent.components ?? []).map((p: any) => [p.name, p])
  );

  for (const pkg of oldPackages) {
    if (newPackages.has(pkg)) {
      const oldVersion = oldPackagesMap.get(pkg)?.version;
      const newVersion = newPackagesMap.get(pkg)?.version;
      if (oldVersion !== newVersion) {
        changed.push(`${pkg}: ${oldVersion ?? '?'} → ${newVersion ?? '?'}`);
      }
    }
  }

  return { added, removed, changed };
}

// --------------------------------------------------------------------------
// Main command runner
// --------------------------------------------------------------------------

export async function runSBOMCommand(args: string[]): Promise<void> {
  const program = new Command();

  program
    .name('sbom')
    .description('SBOM generation and validation for Stackwright projects')
    .argument('[subcommand]', 'Subcommand to run', 'generate')
    .argument('[options]', 'Subcommand-specific options');

  // Parse just the subcommand and its args
  const [subcommand, ...subArgs] = args;

  switch (subcommand) {
    case 'generate': {
      const opts = program
        .name('generate')
        .description('Generate SBOM files')
        .option('--json', 'Output machine-readable JSON')
        .option(
          '--formats <formats>',
          'Comma-separated list of formats (spdx,cyclonedx,build-manifest)',
          'spdx,cyclonedx,build-manifest'
        )
        .option('--include-dev', 'Include dev dependencies')
        .option('--no-peer-deps', 'Exclude peer dependencies')
        .parse(subArgs)
        .opts();

      const formats = opts.formats?.split(',').map((f) => f.trim()) ?? [
        'spdx',
        'cyclonedx',
        'build-manifest',
      ];

      try {
        const result = await generateSBOM({
          formats,
          includeDevDependencies: opts.includeDev,
          includePeerDependencies: !opts.noPeerDeps,
        });

        if (opts.json) {
          outputResult(result, { json: true });
        } else {
          console.log(`SBOM generated successfully:`);
          console.log(`  Output: ${result.outputDir}`);
          result.files.forEach((f) => console.log(`  - ${path.basename(f)}`));
        }
      } catch (err) {
        outputError(String(err), 'SBOM_GENERATION_FAILED', { json: opts.json }, 2);
      }
      break;
    }

    case 'validate': {
      const opts = program
        .name('validate')
        .description('Validate an SBOM file')
        .option('--json', 'Output machine-readable JSON')
        .argument('<file>', 'SBOM file to validate')
        .parse(subArgs)
        .opts();

      const fileArg = program.args[0];
      if (!fileArg) {
        outputError('Missing SBOM file argument', 'MISSING_ARGUMENT', { json: opts.json }, 1);
        return;
      }

      try {
        const result = await validateSBOM({ inputFile: fileArg });

        if (opts.json) {
          outputResult(result, { json: true });
        } else {
          if (result.valid) {
            console.log(`✓ SBOM is valid (${result.format})`);
          } else {
            console.log('✗ SBOM is invalid:');
            result.errors.forEach((e) => console.log(`  - ${e}`));
          }
        }
      } catch (err) {
        outputError(String(err), 'SBOM_VALIDATION_FAILED', { json: opts.json }, 2);
      }
      break;
    }

    case 'diff': {
      const opts = program
        .name('diff')
        .description('Compare two SBOM files')
        .option('--json', 'Output machine-readable JSON')
        .argument('<old>', 'Path to old SBOM')
        .argument('<new>', 'Path to new SBOM')
        .parse(subArgs)
        .opts();

      const [oldFile, newFile] = program.args;
      if (!oldFile || !newFile) {
        outputError('Missing SBOM file arguments', 'MISSING_ARGUMENTS', { json: opts.json }, 1);
        return;
      }

      try {
        const result = await diffSBOM({ oldFile, newFile });

        if (opts.json) {
          outputResult(result, { json: true });
        } else {
          console.log('SBOM Diff Results:');

          if (result.added.length > 0) {
            console.log('\n  Added:');
            result.added.forEach((p) => console.log(`    + ${p}`));
          }

          if (result.removed.length > 0) {
            console.log('\n  Removed:');
            result.removed.forEach((p) => console.log(`    - ${p}`));
          }

          if (result.changed.length > 0) {
            console.log('\n  Changed:');
            result.changed.forEach((c) => console.log(`    ~ ${c}`));
          }

          if (
            result.added.length === 0 &&
            result.removed.length === 0 &&
            result.changed.length === 0
          ) {
            console.log('\n  No differences found.');
          }
        }
      } catch (err) {
        outputError(String(err), 'SBOM_DIFF_FAILED', { json: opts.json }, 2);
      }
      break;
    }

    default:
      console.log(`Unknown subcommand: ${subcommand}`);
      console.log('Available subcommands: generate, validate, diff');
      process.exit(1);
  }
}

// --------------------------------------------------------------------------
// Commander registration
// --------------------------------------------------------------------------

export function registerSBOM(program: Command): void {
  program
    .command('sbom')
    .description('Generate and validate SBOM files for Stackwright projects')
    .argument('[subcommand]', 'Subcommand to run', 'generate')
    .argument('[args...]', 'Arguments for the subcommand')
    .action(async (subcommand: string, args: string[]) => {
      await runSBOMCommand([subcommand, ...args]);
    });
}
