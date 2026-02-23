import fs from 'fs-extra';
import path from 'path';
import { Project } from 'ts-morph';

interface PropertyInfo {
  name: string;
  type: string;
  optional: boolean;
  description: string;
}

interface ContentTypeInfo {
  properties: PropertyInfo[];
  yamlKey: string;
}

interface ContentReference {
  contentTypes: Record<string, ContentTypeInfo>;
  examples: Record<string, string>;
  lastGenerated: string;
}

async function generateContentReference() {
  console.log('🔧 Generating Stackwright content type reference...');
  
  // Debug the paths
  const scriptDir = __dirname;
  const coreDir = path.join(scriptDir, '../../core');
  const tsConfigPath = path.join(coreDir, 'tsconfig.json');
  const contentTypesPath = path.join(coreDir, 'src/types/content.tsx');
  
  console.log('📁 Script directory:', scriptDir);
  console.log('📁 Core directory:', coreDir);
  console.log('📁 TSConfig path:', tsConfigPath);
  console.log('📁 Content types path:', contentTypesPath);
  
  // Check if files exist
  console.log('✅ TSConfig exists:', await fs.pathExists(tsConfigPath));
  console.log('✅ Content types exists:', await fs.pathExists(contentTypesPath));
  
  if (!await fs.pathExists(contentTypesPath)) {
    console.log('📂 Available files in types directory:');
    const typesDir = path.join(coreDir, 'src/types');
    if (await fs.pathExists(typesDir)) {
      const files = await fs.readdir(typesDir);
      console.log(files);
    } else {
      console.log('❌ Types directory does not exist');
    }
    throw new Error(`Content types file not found at: ${contentTypesPath}`);
  }
  
  const project = new Project({
    tsConfigFilePath: tsConfigPath
  });
  
  // Load the content types file
  const contentTypesFile = project.getSourceFile(contentTypesPath);
  
  if (!contentTypesFile) {
    throw new Error('Could not load content types file with ts-morph');
  }
  
  const reference: ContentReference = {
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
      const properties: PropertyInfo[] = iface.getProperties().map(prop => ({
        name: prop.getName(),
        type: prop.getTypeNode()?.getText() || 'unknown',
        optional: prop.hasQuestionToken(),
        description: prop.getJsDocs().map(doc => doc.getDescription()).join(' ')
      }));
      
      function getYamlKey(interfaceName: string): string {
        // Remove 'Content' suffix and convert to snake_case
        const baseName = interfaceName.replace(/Content$/, '');
        return baseName
          .replace(/([A-Z])/g, (match, letter, index) => index === 0 ? letter.toLowerCase() : `_${letter.toLowerCase()}`)
          .toLowerCase();
      }

      reference.contentTypes[name] = {
        properties,
        yamlKey: getYamlKey(name)
      };
      
      console.log(`✅ Added content type: ${name} -> ${reference.contentTypes[name].yamlKey}`);
    }
  }
  
  // Generate YAML examples for each content type
  reference.examples = generateYamlExamples(reference.contentTypes);
  
  // Write the reference file
  const outputPath = path.join(__dirname, '../src/generated/contentTypeReference.json');
  await fs.ensureDir(path.dirname(outputPath));
  await fs.writeFile(outputPath, JSON.stringify(reference, null, 2));
  
  console.log(`✅ Generated content reference: ${outputPath}`);
  console.log(`📊 Found ${Object.keys(reference.contentTypes).length} content types`);
}

function generateYamlExamples(contentTypes: Record<string, ContentTypeInfo>): Record<string, string> {
  const examples: Record<string, string> = {};
  
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

function generateGenericExample(yamlKey: string, properties: PropertyInfo[]): string {
  const example = [`content:`, `  - ${yamlKey}:`];
  
  for (const prop of properties.slice(0, 5)) { // Limit to first 5 props
    const indent = '      ';
    if (prop.type.includes('string')) {
      example.push(`${indent}${prop.name}: "example value"`);
    } else if (prop.type.includes('number')) {
      example.push(`${indent}${prop.name}: 100`);
    } else if (prop.type.includes('boolean')) {
      example.push(`${indent}${prop.name}: true`);
    }
  }
  
  return example.join('\n');
}

if (require.main === module) {
  generateContentReference().catch(console.error);
}

export { generateContentReference };