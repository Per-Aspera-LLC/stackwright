import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { ContentBrief } from '../types/brief';

export async function copyBriefAssets(brief: ContentBrief, projectPath: string) {
  const publicDir = path.join(projectPath, 'public');
  await fs.ensureDir(publicDir);
  
  // Copy available assets
  for (const asset of brief.assets.available) {
    try {
      const destPath = path.join(publicDir, 'images', asset.filename);
      await fs.ensureDir(path.dirname(destPath));
      await fs.copy(asset.path, destPath);
      console.log(chalk.green(`✅ Copied ${asset.filename}`));
    } catch (error) {
      console.log(chalk.yellow(`⚠️  Could not copy ${asset.filename}`));
    }
  }
  
  // Create placeholder files for missing assets
  for (const spec of brief.imageSpecs) {
    const placeholderPath = path.join(publicDir, 'images', `${spec.id}-placeholder.svg`);
    const placeholder = `<svg width="${spec.dimensions.split('x')[0]}" height="${spec.dimensions.split('x')[1]}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f3f4f6"/>
  <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#6b7280">${spec.description}</text>
</svg>`;
    await fs.writeFile(placeholderPath, placeholder);
    console.log(chalk.blue(`📝 Created placeholder for ${spec.id}`));
  }
}