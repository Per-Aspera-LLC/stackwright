import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import yaml from 'js-yaml';
import { analyzeBrief } from '../utils/briefAnalyzer';
import { ContentBrief } from '../types/brief';
import { createProjectStructure } from '../utils/projectStructure';
import { generateAIContentFromBrief, generateAIImages } from '../utils/aiGeneration';
import { copyBriefAssets } from '../utils/assetManagement';
import { generateContentFromBrief } from '../utils/briefGeneration';
import contentReference from '../generated/contentTypeReference.json';

interface CreateOptions {
  projectName?: string;
  description?: string;
  useAI?: boolean;
  apiKey?: string;
  fromDir?: string;
  aiPipeline?: boolean;
  advanced?: boolean;
}

export async function createProject(projectName: string, options: CreateOptions = {}) {
  if (options.fromDir) {
    return createFromDirectory(projectName, options);
  }
  
  return createInteractive(projectName);
}

async function createFromDirectory(projectName: string, options: CreateOptions) {
  console.log(chalk.blue('🔍 Analyzing content brief...'));
  
  dotenv.config();
  const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
  
  const brief = await analyzeBrief(options.fromDir!, apiKey);
  
  if (options.aiPipeline && apiKey) {
    return createWithAI(projectName, brief, apiKey);
  } else {
    return createWithAssets(projectName, brief);
  }
}

async function createWithAI(projectName: string, brief: ContentBrief, apiKey: string) {
  console.log(chalk.blue('🤖 AI Pipeline - Generating enhanced content...'));
  
  // Load and prepare the pages YAML text
  let pagesYamlText = 'No specific pages defined';
  if (brief.content.pages && brief.content.pages.length > 0) {
    pagesYamlText = yaml.dump({ pages: brief.content.pages });
  }
  
  // Prepare the component map
  const exampleComponentMap = JSON.stringify(contentReference, null, 2);
  
  const contentAndImages = await generateAIContentFromBrief(
    brief, 
    apiKey, 
    pagesYamlText, 
    exampleComponentMap
  );
  
  const projectPath = path.join(process.cwd(), projectName);
  
  await fs.ensureDir(projectPath);
  await createProjectStructure(projectPath, contentAndImages.content, projectName, brief);
  await copyBriefAssets(brief, projectPath);
  await generateAIImages(contentAndImages, apiKey, projectPath);
  
  console.log(chalk.green('\n✅ AI-enhanced site ready!'));
  console.log(chalk.blue(`\nNext: cd ${projectName} && npm install && npm run dev`));
}

async function createWithAssets(projectName: string, brief: ContentBrief) {
  console.log(chalk.blue('🛠️ Production Pipeline - Using provided assets...'));
  
  const content = generateContentFromBrief(brief);
  const projectPath = path.join(process.cwd(), projectName);
  
  await fs.ensureDir(projectPath);
  await createProjectStructure(projectPath, content, projectName, brief);
  await copyBriefAssets(brief, projectPath);
  
  console.log(chalk.green('\n✅ Production site ready!'));
  console.log(chalk.blue(`\nNext: cd ${projectName} && npm install && npm run dev`));
}

async function createInteractive(projectName: string) {
  console.log(chalk.blue('🔥 Welcome to StackWright! 🚢 \n'));

  const projectPath = path.join(process.cwd(), projectName);
  if (await fs.pathExists(projectPath)) {
    console.log(chalk.red(`❌ Directory ${projectName} already exists!`));
    return;
  }

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'description',
      message: 'What\'s your site about?',
      default: 'A professional website'
    },
    {
      type: 'confirm',
      name: 'useAI',
      message: 'Want AI help generating content?',
      default: false
    },
    {
      type: 'password',
      name: 'apiKey',
      message: 'OpenAI API Key (optional):',
      when: (answers) => answers.useAI,
      mask: '*'
    }
  ]);

  await fs.ensureDir(projectPath);
  
  let content;
  if (answers.useAI && answers.apiKey) {
    console.log(chalk.yellow('🤖 Generating AI content...'));
    content = await generateAIContent(answers.description, answers.apiKey);
  } else {
    console.log(chalk.yellow('📝 Using template content...'));
    content = generateTemplateContent(answers.description);
  }
  
  await createProjectStructure(projectPath, content, projectName);
  
  console.log(chalk.green('\n✅ Site ready!'));
  console.log(chalk.blue(`\nNext: cd ${projectName} && npm install && npm run dev`));
}

async function generateAIContent(description: string, apiKey: string) {
  const openai = new OpenAI({ apiKey });
  
  const prompt = `Create Stackwright YAML content for: ${description}

Return JSON with page names as keys and YAML strings as values.
Create minimum of 4 pages: home, about, services, contact.

Each page should have content_items with different content types.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 3000
    });
    
    const content = response.choices[0].message.content;
    if (!content) throw new Error('No content generated');
    
    return JSON.parse(content);
  } catch (error) {
    console.log(chalk.red('❌ AI failed, using templates'));
    return generateTemplateContent(description);
  }
}

function generateTemplateContent(description: string) {
  const companyName = description.charAt(0).toUpperCase() + description.slice(1);

  return {
    home: `content:
  content_items:
    - main:
        label: "hero"
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        heading:
          text: "Welcome to ${companyName}"
          size: "h1"
          color: "#ffffff"
        textBlocks:
          - text: "We deliver exceptional results"
            size: "h5"
            color: "#ffffff"`,

    about: `content:
  content_items:
    - main:
        label: "about"
        background: "#f5f5f5"
        heading:
          text: "About ${companyName}"
          size: "h1"
          color: "#333333"
        textBlocks:
          - text: "We are passionate about excellence"
            size: "body1"
            color: "#333333"`,

    services: `content:
  content_items:
    - main:
        label: "services"
        background: "#ffffff"
        heading:
          text: "Our Services"
          size: "h1"
          color: "#333333"
        textBlocks:
          - text: "Comprehensive solutions for your needs"
            size: "body1"
            color: "#333333"`,

    contact: `content:
  content_items:
    - main:
        label: "contact"
        background: "#f5f5f5"
        heading:
          text: "Get In Touch"
          size: "h1"
          color: "#333333"
        textBlocks:
          - text: "Ready to start? Let's talk"
            size: "body1"
            color: "#333333"`
  };
}