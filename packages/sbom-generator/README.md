# @stackwright/sbom-generator

SBOM (Software Bill of Materials) generation for Stackwright projects. Generates SPDX 2.3, CycloneDX 1.5, and Stackwright-specific build manifest formats.

## Installation

```bash
pnpm add @stackwright/sbom-generator
```

## Usage

### Basic Usage

```typescript
import { createSBOM } from '@stackwright/sbom-generator';

const sbom = await createSBOM({
    projectRoot: '/path/to/your/project',
    formats: ['spdx', 'cyclonedx', 'build-manifest'],
});

// Write to disk
await sbom.writeTo('./sbom-output');

// Get summary
const summary = sbom.getSummary();
console.log(`Generated SBOM for ${summary.projectName} with ${summary.totalDependencies} dependencies`);
```

### Generate Specific Formats

```typescript
// SPDX 2.3 only
const spdxOnly = await createSBOM({
    projectRoot: process.cwd(),
    formats: ['spdx'],
});

// CycloneDX 1.5 only
const cyclonedxOnly = await createSBOM({
    projectRoot: process.cwd(),
    formats: ['cyclonedx'],
});

// Stackwright build manifest only
const manifest = await createSBOM({
    projectRoot: process.cwd(),
    formats: ['build-manifest'],
});
```

### Access Generated Content

```typescript
const sbom = await createSBOM({
    projectRoot: process.cwd(),
    formats: ['spdx', 'cyclonedx', 'build-manifest'],
});

// Access SPDX document
if (sbom.spdx) {
    console.log('SPDX Version:', sbom.spdx.spdxVersion);
    console.log('Packages:', sbom.spdx.packages.length);
}

// Access CycloneDX document
if (sbom.cyclonedx) {
    console.log('Components:', sbom.cyclonedx.components.length);
}

// Access Build Manifest
if (sbom.buildManifest) {
    console.log('Metadata:', sbom.buildManifest.metadata);
}
```

### Using Formatters Directly

```typescript
import { toSPDXJSON, toCycloneDXJSON, toBuildManifestJSON } from '@stackwright/sbom-generator';

// Convert to JSON strings
const spdxJson = toSPDXJSON(spdxDocument);
const cyclonedxJson = toCycloneDXJSON(cyclonedxDocument);
const manifestJson = toBuildManifestJSON(buildManifest);
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `projectRoot` | `string` | Required | Root directory of the project |
| `formats` | `SBOMFormat[]` | Required | Output formats to generate |
| `includeDevDependencies` | `boolean` | `false` | Include dev dependencies |
| `includePeerDependencies` | `boolean` | `true` | Include peer dependencies |
| `outputDir` | `string` | `.stackwright/sbom/` | Output directory for files |

## Output Formats

### SPDX 2.3

Standard SBOM format with:
- Package verification using SHA-256 checksums
- PURL-based external references
- Relationship mapping (DESCRIBES, CONTAINS, DEPENDS_ON)
- JSON and tag-value output formats

### CycloneDX 1.5

Modern SBOM format with:
- Component-based architecture
- Dependency graph with transitive tracking
- License intelligence
- JSON output

### Build Manifest

Stackwright-specific format with:
- Package categorization (core, theme, plugin, external)
- Dependency depth tracking
- Workspace awareness for monorepos
- Zod schema validation

## Extensibility via Hooks

The SBOM generator supports a hook system for extensibility. Pro packages can register hooks to extend functionality:

```typescript
import { registerSBOMHook } from '@stackwright/sbom-generator';

registerSBOMHook({
  type: 'postAnalyze',
  name: 'cve-enrichment',
  priority: 10,
  critical: false,
  handler: async (context) => {
    // Add vulnerability data to context.dependencies
  },
});
```

### Hook Lifecycle Points

| Hook | When | Use Case |
|------|------|----------|
| `preGenerate` | Before analysis | Load credentials, validate config |
| `postAnalyze` | After dependency analysis | Enrich with CVE data |
| `preFormat` | Before each format | Prepare format-specific data |
| `postFormat` | After each format | Sign SBOM, add attestations |
| `preWrite` | Before writing files | Validate output |
| `postWrite` | After all files written | Publish to registry |

### Hook Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | `SBOMHookType` | Required | Lifecycle point |
| `name` | `string` | Required | Unique hook name |
| `priority` | `number` | `50` | Lower = runs first |
| `critical` | `boolean` | `false` | If true, failure fails entire SBOM generation |
| `handler` | `function` | Required | Async function to execute |

### Hook Context

The context object passed to hooks contains:

```typescript
interface SBOMHookContext {
  projectRoot: string;      // Project directory
  formats: SBOMFormat[];    // Output formats
  outputDir: string;        // Output directory
  project?: ProjectInfo;    // Available after postAnalyze
  dependencies?: Dependency[]; // Available after postAnalyze
  spdx?: SPDXDocument;      // Available after SPDX generation
  cyclonedx?: CycloneDXDocument; // Available after CycloneDX generation
  buildManifest?: BuildManifest; // Available after manifest generation
}
```

### Pro Integration

Import a Pro package to auto-register its hooks:

```typescript
import '@stackwright-pro/sbom-enterprise'; // hooks auto-register on import

// SBOM now includes CVE enrichment, signing, and SLSA attestation
const sbom = await createSBOM({ projectRoot, formats: ['spdx'] });
```

### Registry Functions

```typescript
import { 
  registerSBOMHook,    // Register a new hook
  getSBOMHooks,       // Get all registered hooks
  getHooksForType,     // Get hooks for specific lifecycle point
  clearSBOMHooks,      // Clear all hooks (useful for testing)
} from '@stackwright/sbom-generator';
```

## CLI Usage

For command-line usage, see the companion package `@stackwright/cli` which includes SBOM generation commands.

## API Reference

### `createSBOM(options)`

Main function to generate an SBOM.

```typescript
interface SBOMOptions {
    projectRoot: string;
    formats: ('spdx' | 'cyclonedx' | 'build-manifest')[];
    includeDevDependencies?: boolean;
    includePeerDependencies?: boolean;
    outputDir?: string;
}
```

Returns: `Promise<SBOM>`

### `SBOM`

The generated SBOM object.

```typescript
interface SBOM {
    project: StackwrightProjectInfo;
    dependencies: NormalizedDependency[];
    spdx?: SPDXDocument;
    cyclonedx?: CycloneDXDocument;
    buildManifest?: BuildManifest;
    writeTo(path: string): Promise<void>;
    getSummary(): SBOMSummary;
}
```

## Debugging

Enable debug output with environment variables:

```bash
STACKWRIGHT_DEBUG=true node your-script.js
NODE_ENV=development STACKWRIGHT_DEBUG=true node your-script.js
```

## License

MIT
