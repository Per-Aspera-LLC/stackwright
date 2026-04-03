const { execSync } = require('child_process');
const fs = require('fs');

function getChangedFiles() {
  const base = process.env.GITHUB_BASE_REF || 'dev';

  try {
    // Ensure the base branch exists locally
    execSync(`git fetch origin ${base}:refs/remotes/origin/${base}`, { 
      stdio: 'pipe',
      timeout: 10000 
    });

    // Try direct diff first
    try {
      const diff = execSync(`git diff --name-only origin/${base}...HEAD`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      return diff.split('\n').filter(Boolean);
    } catch (diffErr) {
      // If diff fails (e.g., no merge base for PR merge commits),
      // fall back to using the first parent of the merge commit
      console.log('⚠️ Direct diff failed, trying merge-base fallback...');
      
      try {
        // Get the first parent (the PR branch HEAD before merge)
        const parent = execSync('git rev-parse --verify HEAD^1', {
          encoding: 'utf-8',
          stdio: 'pipe',
        }).trim();
        
        const diff = execSync(`git diff --name-only origin/${base}...${parent}`, {
          encoding: 'utf-8',
          stdio: 'pipe',
        });
        return diff.split('\n').filter(Boolean);
      } catch (fallbackErr) {
        // If that also fails, use the PR branch HEAD (second parent of merge commit)
        console.log('⚠️ Merge-base fallback failed, trying PR branch diff...');
        
        // For merge commits: HEAD^1 is target branch, HEAD^2 is PR branch
        const prBranchHead = execSync('git rev-parse HEAD^2', {
          encoding: 'utf-8',
          stdio: 'pipe',
        }).trim();
        
        const diff = execSync(`git diff --name-only origin/${base}...${prBranchHead}`, {
          encoding: 'utf-8',
          stdio: 'pipe',
        });
        return diff.split('\n').filter(Boolean);
      }
    }
  } catch (err) {
    console.error(`❌ Could not determine changed files from ${base}`, err.message);
    process.exit(1);
  }
}

function hasPackageChanges(files) {
  return files.some((file) => file.startsWith('packages/'));
}

function hasChangeset(files) {
  return files.some((file) => file.startsWith('.changeset/') && file.endsWith('.md'));
}

const changedFiles = getChangedFiles();

if (hasPackageChanges(changedFiles) && !hasChangeset(changedFiles)) {
  console.error(
    '\x1b[31m❌ This PR modifies packages but includes no Changeset.\n' +
      'Please run: pnpm changeset\x1b[0m'
  );
  process.exit(1);
} else {
  console.log('✅ Changeset requirement satisfied.');
}
