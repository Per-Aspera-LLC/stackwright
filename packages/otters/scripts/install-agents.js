#!/usr/bin/env node
/**
 * Postinstall script for @stackwright/otters
 * Copies agent JSON files to ~/.code_puppy/agents/ for code-puppy discovery
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Get the package root - this script is at scripts/install-agents.js
// so we go up two directories
const scriptDir = __dirname;
const packageRoot = path.resolve(scriptDir, '..', '..');

const AGENTS_DIR = path.join(os.homedir(), '.code_puppy', 'agents');

async function installAgents() {
  try {
    // Ensure ~/.code_puppy/agents/ exists
    await fs.promises.mkdir(AGENTS_DIR, { recursive: true });

    // Copy all JSON files from src/ to ~/.code_puppy/agents/
    const srcDir = path.join(packageRoot, 'src');
    
    console.log(`Installing otters from: ${srcDir}`);
    
    const files = await fs.promises.readdir(srcDir);

    let installed = 0;
    for (const file of files) {
      if (file.endsWith('-otter.json')) {
        const srcPath = path.join(srcDir, file);
        const destPath = path.join(AGENTS_DIR, file);

        await fs.promises.copyFile(srcPath, destPath);
        console.log(`✅ Installed: ${file}`);
        installed++;
      }
    }

    if (installed > 0) {
      console.log(`\n🦦 Otters installed to ${AGENTS_DIR}`);
      console.log('   Run "code-puppy -i -a stackwright-foreman-otter" to start!');
    } else {
      console.log('⚠️  No otter files found');
    }
  } catch (error) {
    // Don't fail the install if this script has issues
    console.warn(`⚠️  Failed to install otters: ${error.message}`);
  }
}

installAgents();
