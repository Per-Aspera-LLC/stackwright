import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import yaml from 'js-yaml';
import { ContentBrief } from '../types/brief';


export async function createProjectStructure(
  projectPath: string, 
  yamlContent: any, 
  projectName: string,
  brief?: ContentBrief
) {
  console.log(chalk.yellow('🛠️  Setting up project structure...'));

  // Create the [slug].tsx that extends the core component
  const slugContent = `// 🛡️ DON'T TOUCH THIS FILE! 
// This is Stackwright magic - edit your content in the YAML files instead
import SlugPage, { getSlugStaticPaths, getSlugStaticProps } from '@stackwright/core/SlugPage';

// Re-export the core component and functions
export default SlugPage;
export const getStaticPaths = getSlugStaticPaths;
export const getStaticProps = getSlugStaticProps;`; 


  // Create package.json
  const packageJson = {
    name: projectName,
    version: "1.0.0",
    private: true,
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
      lint: "next lint"
    },
    dependencies: {
      "next": "^15.0.0",
      "react": "^18.0.0",
      "react-dom": "^18.0.0",
      "@stackwright/core": "latest",
      "@mui/material": "^5.0.0",
      "@emotion/react": "^11.0.0",
      "@emotion/styled": "^11.0.0"
    },
    devDependencies: {
      "@types/node": "^24.1",
      "@types/react": "^18.0.0",
      "@types/react-dom": "^18.0.0",
      "typescript": "^5.0.0",
      "eslint": "^8.0.0",
      "eslint-config-next": "^15.0.0"
    }
  };

  // Create Next.js config
  const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        'js-yaml': false,
      };
    }
    
    // Watch YAML files for hot reload in development
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: /node_modules/,
      };
      
      // Add YAML files to webpack's file watching
      if (!config.module) config.module = {};
      if (!config.module.rules) config.module.rules = [];
      
      config.module.rules.push({
        test: /\\.ya?ml$/,
        type: 'asset/source',
      });
    }
    
    return config;
  },
}

module.exports = nextConfig
`;

  // Create TypeScript config
  const tsConfig = {
    compilerOptions: {
      target: "es5",
      lib: ["dom", "dom.iterable", "es6"],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      noEmit: true,
      esModuleInterop: true,
      module: "esnext",
      moduleResolution: "node",
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: "preserve",
      incremental: true,
      plugins: [{ name: "next" }],
      paths: { "@/*": ["./*"] }
    },
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    exclude: ["node_modules"]
  };

  // Create directories
  await fs.ensureDir(path.join(projectPath, 'pages'));
  await fs.ensureDir(path.join(projectPath, 'public', 'images'));

  // Create files
  await fs.writeFile(path.join(projectPath, 'pages/[slug].tsx'), slugContent);
  await fs.writeFile(path.join(projectPath, 'package.json'), JSON.stringify(packageJson, null, 2));
  await fs.writeFile(path.join(projectPath, 'next.config.js'), nextConfig);
  await fs.writeFile(path.join(projectPath, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));
  
  console.log(chalk.green('✅ Created pages/[slug].tsx'));
  console.log(chalk.green('✅ Created package.json'));
  console.log(chalk.green('✅ Created Next.js configuration'));
  
  // Create YAML content files
  const pageNames = Object.keys(yamlContent);
  for (const pageName of pageNames) {
    const yamlString = yamlContent[pageName];
    if (yamlString && typeof yamlString === 'string') {
      const dir = path.join(projectPath, 'pages', pageName);
      await fs.ensureDir(dir);
      await fs.writeFile(path.join(dir, 'content.yaml'), yamlString);
      console.log(chalk.green(`✅ Created pages/${pageName}/content.yaml`));
    }
  }
  
  // Create config
  const themeName = brief?.themeName || 'corporate';
  const brandName = brief?.brand?.name || projectName;
  
  const config: any = {
    site: {
      title: brandName,
      themeName: themeName,
      description: brief?.brand?.tagline || `${brandName} website built with Stackwright`,
      navigation: [
        { label: "Home", href: "/" },
        { label: "About", href: "/about" },
        { label: "Services", href: "/services" },
        { label: "Contact", href: "/contact" }
      ],
      appBar: {
        textColor: 'primary',
        backgroundColor: 'background'
      },
      footer: {
        copyright: `© ${new Date().getFullYear()} ${brandName}. All rights reserved.`
      }
    }
  };

  // Add custom theme if available
  if (brief?.customTheme) {
    config.site.customTheme = brief.customTheme;
  }
  
  await fs.writeFile(
    path.join(projectPath, 'stackwright.config.yaml'), 
    yaml.dump(config)
  );
  
  console.log(chalk.green('✅ Created stackwright.config.yaml'));
}