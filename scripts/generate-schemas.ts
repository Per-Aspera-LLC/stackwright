#!/usr/bin/env ts-node

import fs from 'fs-extra';
import path from 'path';
import { Project, SyntaxKind } from 'ts-morph';

interface SchemaProperty {
  type?: string;
  description?: string;
  enum?: string[];
  pattern?: string;
  minimum?: number;
  maximum?: number;
  items?: any;
  oneOf?: any[];
  $ref?: string;
  required?: string[];
  additionalProperties?: boolean;
  properties?: Record<string, any>;
}

interface JsonSchema {
  $schema: string;
  title: string;
  description: string;
  type: string;
  properties: Record<string, SchemaProperty>;
  required: string[];
  additionalProperties: boolean;
  definitions?: Record<string, any>;
}

interface ComponentInfo {
  name: string;
  typeName: string;
  filePath: string;
}

async function generateJsonSchemas() {
  console.log('🔧 Generating JSON Schemas from TypeScript types...');

  const project = new Project({
    tsConfigFilePath: path.join(__dirname, '../packages/core/tsconfig.json'),
  });

  // Discover components dynamically
  const components = await discoverComponents();
  console.log(`🔍 Discovered ${components.length} components`);

  const sourceFile = project.getSourceFileOrThrow('./packages/core/src/types/content.tsx');
  
  // Get all interfaces and types
  const interfaces = sourceFile.getInterfaces();
  const typeAliases = sourceFile.getTypeAliases();
  
  console.log(`📚 Found ${interfaces.length} interfaces and ${typeAliases.length} type aliases`);

  const definitions: Record<string, any> = {};
  
  // Generate simplified schemas for discovered components
  for (const component of components) {
    const contentInterface = interfaces.find(iface => iface.getName() === component.typeName);
    if (contentInterface) {
      definitions[`${component.typeName}Simple`] = generateSimplifiedSchema(contentInterface);
      console.log(`📝 Generated schema for ${component.typeName}`);
    }
  }

  // Process enums
  const enums = sourceFile.getEnums();
  for (const enumDecl of enums) {
    const name = enumDecl.getName();
    const members = enumDecl.getMembers().map(member => 
      member.getValue() || member.getName()
    );
    
    definitions[name] = {
      type: "string",
      enum: members,
      description: `${name} options`
    };
  }

  // Process type aliases (union types)
  for (const typeAlias of typeAliases) {
    const name = typeAlias.getName();
    const typeNode = typeAlias.getTypeNode();
    
    if (typeNode && typeNode.getKind() === SyntaxKind.UnionType) {
      const unionType = typeNode.asKindOrThrow(SyntaxKind.UnionType);
      const literals = unionType.getTypeNodes()
        .filter(node => node.getKind() === SyntaxKind.LiteralType)
        .map(node => {
          const literal = node.asKindOrThrow(SyntaxKind.LiteralType);
          return literal.getText().replace(/'/g, '');
        });
      
      definitions[name] = {
        type: "string",
        enum: literals,
        description: `${name} options`
      };
    }
  }

  // Process interfaces
  for (const iface of interfaces) {
    const name = iface.getName();
    
    // Special handling for ContentItem (union type with index signature)
    if (name === 'ContentItem') {
      const contentTypeRefs = components.map((comp: ComponentInfo) => ({ $ref: `#/definitions/${comp.typeName}Simple` }));
      definitions[name] = {
        type: "object",
        additionalProperties: {
          oneOf: contentTypeRefs
        }
      };
      continue;
    }
    
    const properties: Record<string, SchemaProperty> = {};
    const required: string[] = [];

    for (const prop of iface.getProperties()) {
      const propName = prop.getName();
      const isOptional = prop.hasQuestionToken();
      const typeText = prop.getType().getText();

      if (!isOptional) {
        required.push(propName);
      }

      // Map TypeScript types to JSON Schema
      properties[propName] = mapTypeToSchema(typeText, propName);
    }

    definitions[name] = {
      type: "object",
      properties,
      required,
      additionalProperties: false
    };
  }

  // Generate main content schema
  const contentSchema: JsonSchema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "Stackwright Content Schema",
    description: "Schema for Stackwright content.yaml files",
    type: "object",
    properties: {
      content: {
        type: "object",
        properties: {
          content_items: {
            type: "array",
            items: {
              $ref: "#/definitions/ContentItem"
            }
          }
        },
        required: ["content_items"],
        additionalProperties: false
      }
    },
    required: ["content"],
    additionalProperties: false,
    definitions
  };

  // Write schema files
  const schemaDir = path.join(__dirname, '../schemas');
  await fs.ensureDir(schemaDir);
  
  await fs.writeJSON(
    path.join(schemaDir, 'content-schema.json'), 
    contentSchema, 
    { spaces: 2 }
  );

  console.log('✅ Generated schemas/content-schema.json');
  console.log(`📊 Generated ${Object.keys(definitions).length} type definitions`);
}

function mapTypeToSchema(typeText: string, propName: string): SchemaProperty {
  // Clean up import paths from type text
  const cleanTypeText = typeText.replace(/import\(".*"\)\./, '');
  
  // Handle common type mappings
  if (cleanTypeText === 'string') {
    // Add specific patterns for certain properties
    if (propName === 'image' || propName.includes('image')) {
      return {
        type: 'string',
        pattern: '^/images/.*\\.(png|jpg|jpeg|gif|svg|webp)$',
        description: 'Path to image file starting with /images/'
      };
    }
    if (propName === 'color') {
      return {
        type: 'string',
        pattern: '^#[0-9A-Fa-f]{6}$|^[a-zA-Z]+$',
        description: 'Color as hex code (#D4AF37) or color name'
      };
    }
    if (propName === 'href') {
      return {
        type: 'string',
        description: 'URL or page path'
      };
    }
    return { type: 'string' };
  }
  
  if (cleanTypeText === 'number') {
    if (propName.includes('size')) {
      return {
        type: 'integer',
        minimum: 10,
        maximum: 2000,
        description: `${propName} in pixels`
      };
    }
    if (propName === 'aspect_ratio') {
      return {
        type: 'number',
        minimum: 0.1,
        maximum: 10,
        description: 'Width/height ratio'
      };
    }
    return { type: 'number' };
  }
  
  if (cleanTypeText === 'boolean') {
    return { type: 'boolean' };
  }

  // Handle array types
  if (cleanTypeText.endsWith('[]')) {
    const itemType = cleanTypeText.slice(0, -2);
    return {
      type: 'array',
      items: mapTypeToSchema(itemType, propName.slice(0, -1)) // Remove 's' from plural
    };
  }

  // Handle known type aliases
  const knownTypes = [
    'TypographyVariant', 'ButtonVariant', 
    'GraphicVariant', 'GraphicPosition', 'AlignmentVariant'
  ];
  
  if (knownTypes.includes(cleanTypeText)) {
    return { $ref: `#/definitions/${cleanTypeText}` };
  }

  // Handle interface references
  if (cleanTypeText.endsWith('Content') || cleanTypeText.endsWith('Block') || cleanTypeText.endsWith('Item')) {
    // Use Simple suffix for Content types that have simplified schemas
    const simplifiedTypes = ['ButtonContent', 'MainContent', 'GraphicContent', 'TabbedContent', 'CarouselContent', 'TimelineContent'];
    if (simplifiedTypes.includes(cleanTypeText)) {
      return { $ref: `#/definitions/${cleanTypeText}Simple` };
    }
    return { $ref: `#/definitions/${cleanTypeText}` };
  }

  // Handle optional/undefined types
  if (cleanTypeText.includes(' | undefined')) {
    const baseType = cleanTypeText.split(' | ')[0];
    return mapTypeToSchema(baseType, propName);
  }

  // Default fallback
  return { type: 'string', description: `${cleanTypeText} type` };
}

async function discoverComponents(): Promise<ComponentInfo[]> {
  const components: ComponentInfo[] = [];
  const componentDirs = [
    './packages/core/src/components/narrative',
    './packages/core/src/components/structural',
    './plugins' // Future extensibility
  ];

  // Get all actual Content interfaces from the types file
  const project = new Project({
    tsConfigFilePath: path.join(__dirname, '../packages/core/tsconfig.json'),
  });
  const sourceFile = project.getSourceFileOrThrow('./packages/core/src/types/content.tsx');
  const availableInterfaces = sourceFile.getInterfaces()
    .filter(iface => iface.getName().endsWith('Content'))
    .map(iface => iface.getName());

  for (const dir of componentDirs) {
    const fullPath = path.join(__dirname, '..', dir);
    if (await fs.pathExists(fullPath)) {
      const files = await fs.readdir(fullPath);
      
      for (const file of files) {
        const filePath = path.join(fullPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile() && file.endsWith('.tsx') && !file.startsWith('index')) {
          const componentName = path.basename(file, '.tsx');
          const expectedTypeName = `${componentName}Content`;
          
          // Only include if the exact type exists
          if (availableInterfaces.includes(expectedTypeName)) {
            components.push({
              name: componentName,
              typeName: expectedTypeName,
              filePath: filePath
            });
          }
        }
      }
    }
  }

  // Add base content types that are used directly
  const baseContentTypes = ['MainContent', 'GraphicContent', 'ButtonContent', 'TabbedContent', 'CarouselContent'];
  for (const typeName of baseContentTypes) {
    if (availableInterfaces.includes(typeName) && !components.find(c => c.typeName === typeName)) {
      components.push({
        name: typeName.replace('Content', ''),
        typeName: typeName,
        filePath: 'types/content.tsx'
      });
    }
  }

  return components;
}

function generateSimplifiedSchema(interfaceDecl: any): SchemaProperty {
  const properties: Record<string, SchemaProperty> = {};
  const required: string[] = [];

  // Get all properties including inherited ones
  const allProperties = getAllProperties(interfaceDecl);
  
  for (const prop of allProperties) {
    const propName = prop.getName();
    const isOptional = prop.hasQuestionToken();
    const typeText = prop.getType().getText();

    if (!isOptional && propName !== 'label') { // Skip BaseContent.label requirement
      required.push(propName);
    }

    properties[propName] = mapTypeToSchema(typeText, propName);
  }

  return {
    type: "object",
    properties,
    required: required.filter(req => !['label', 'color', 'background', 'size'].includes(req)),
    additionalProperties: false
  };
}

function getAllProperties(interfaceDecl: any): any[] {
  const properties = new Map();
  
  // Get properties from extended interfaces first
  for (const extendedType of interfaceDecl.getExtends()) {
    const extendedName = extendedType.getExpression().getText();
    const sourceFile = interfaceDecl.getSourceFile();
    const extendedInterface = sourceFile.getInterface(extendedName);
    
    if (extendedInterface) {
      const extendedProperties = getAllProperties(extendedInterface);
      for (const prop of extendedProperties) {
        properties.set(prop.getName(), prop);
      }
    }
  }
  
  // Get direct properties (these override inherited ones)
  for (const prop of interfaceDecl.getProperties()) {
    properties.set(prop.getName(), prop);
  }
  
  return Array.from(properties.values());
}

if (require.main === module) {
  generateJsonSchemas().catch(console.error);
}

export { generateJsonSchemas };
