"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateContentReference = generateContentReference;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const ts_morph_1 = require("ts-morph");
async function generateContentReference() {
    console.log('🔧 Generating Stackwright content type reference...');
    // Debug the paths
    const scriptDir = __dirname;
    const coreDir = path_1.default.join(scriptDir, '../../stackwright-core');
    const tsConfigPath = path_1.default.join(coreDir, 'tsconfig.json');
    const contentTypesPath = path_1.default.join(coreDir, 'src/types/content.tsx');
    console.log('📁 Script directory:', scriptDir);
    console.log('📁 Core directory:', coreDir);
    console.log('📁 TSConfig path:', tsConfigPath);
    console.log('📁 Content types path:', contentTypesPath);
    // Check if files exist
    console.log('✅ TSConfig exists:', await fs_extra_1.default.pathExists(tsConfigPath));
    console.log('✅ Content types exists:', await fs_extra_1.default.pathExists(contentTypesPath));
    if (!await fs_extra_1.default.pathExists(contentTypesPath)) {
        console.log('📂 Available files in types directory:');
        const typesDir = path_1.default.join(coreDir, 'src/types');
        if (await fs_extra_1.default.pathExists(typesDir)) {
            const files = await fs_extra_1.default.readdir(typesDir);
            console.log(files);
        }
        else {
            console.log('❌ Types directory does not exist');
        }
        throw new Error(`Content types file not found at: ${contentTypesPath}`);
    }
    const project = new ts_morph_1.Project({
        tsConfigFilePath: tsConfigPath
    });
    // Load the content types file
    const contentTypesFile = project.getSourceFile(contentTypesPath);
    if (!contentTypesFile) {
        throw new Error('Could not load content types file with ts-morph');
    }
    const reference = {
        contentTypes: {},
        examples: {},
        lastGenerated: new Date().toISOString()
    };
    // Extract interface definitions
    const interfaces = contentTypesFile.getInterfaces();
    console.log(`🔍 Found ${interfaces.length} interfaces`);
    for (const iface of interfaces) {
        const name = iface.getName();
        console.log(`📋 Processing interface: ${name}`);
        // Skip base types, focus on content types
        if (name.endsWith('Content') && !name.startsWith('Page')) {
            const properties = iface.getProperties().map(prop => ({
                name: prop.getName(),
                type: prop.getTypeNode()?.getText() || 'unknown',
                optional: prop.hasQuestionToken(),
                description: prop.getJsDocs().map(doc => doc.getDescription()).join(' ')
            }));
            reference.contentTypes[name] = {
                properties,
                yamlKey: name.replace('Content', '').toLowerCase().replace(/([A-Z])/g, '_$1').substring(1)
            };
            console.log(`✅ Added content type: ${name} -> ${reference.contentTypes[name].yamlKey}`);
        }
    }
    // Generate YAML examples for each content type
    reference.examples = generateYamlExamples(reference.contentTypes);
    // Write the reference file
    const outputPath = path_1.default.join(__dirname, '../src/generated/contentTypeReference.json');
    await fs_extra_1.default.ensureDir(path_1.default.dirname(outputPath));
    await fs_extra_1.default.writeFile(outputPath, JSON.stringify(reference, null, 2));
    console.log(`✅ Generated content reference: ${outputPath}`);
    console.log(`📊 Found ${Object.keys(reference.contentTypes).length} content types`);
}
function generateYamlExamples(contentTypes) {
    const examples = {};
    for (const [typeName, typeInfo] of Object.entries(contentTypes)) {
        const yamlKey = typeInfo.yamlKey;
        // Generate example YAML based on the type structure
        switch (yamlKey) {
            case 'main':
                examples[yamlKey] = `content:
  - main:
      label: "section_name"
      background: "whitesmoke"
      heading:
        text: "Your Headline"
        size: "h2"
        color: "inherit"
      textBlocks:
        - text: "Your compelling content goes here."
          size: "body1"
      graphic:
        image: "/images/your-image.svg"
        aspect_ratio: "16/9"
        max_size: 100
        min_size: 50
      graphic_position: "right"
      buttons:
        - text: "Call to Action"
          href: "/contact"
          variant: "contained"
          color: "primary"`;
                break;
            case 'icon_grid':
                examples[yamlKey] = `content:
  - icon_grid:
      label: "features"
      heading:
        text: "How It Works"
        size: "h2"
      iconsPerRow: 3
      icons:
        - iconId: "/images/icons/feature1.svg"
          text:
            text: "Feature description"
            size: "body1"
        - iconId: "/images/icons/feature2.svg"
          text:
            text: "Another feature"
            size: "body1"`;
                break;
            case 'carousel':
                examples[yamlKey] = `content:
  - carousel:
      label: "testimonials"
      slides:
        - heading: "Client Success"
          content: "Amazing results achieved"
        - heading: "Another Win"
          content: "More success stories"`;
                break;
            default:
                // Generate a basic example from the type properties
                examples[yamlKey] = generateGenericExample(yamlKey, typeInfo.properties);
        }
    }
    return examples;
}
function generateGenericExample(yamlKey, properties) {
    const example = [`content:`, `  - ${yamlKey}:`];
    for (const prop of properties.slice(0, 5)) { // Limit to first 5 props
        const indent = '      ';
        if (prop.type.includes('string')) {
            example.push(`${indent}${prop.name}: "example value"`);
        }
        else if (prop.type.includes('number')) {
            example.push(`${indent}${prop.name}: 100`);
        }
        else if (prop.type.includes('boolean')) {
            example.push(`${indent}${prop.name}: true`);
        }
    }
    return example.join('\n');
}
if (require.main === module) {
    generateContentReference().catch(console.error);
}
