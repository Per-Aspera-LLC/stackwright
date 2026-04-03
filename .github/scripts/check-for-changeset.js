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
      console.log('⚠️ Direct diff failed, trying HEAD^1 fallback...');
      
      // Try HEAD^1 (first parent of merge commit, or parent of regular commit)
      try {
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
        console.log('⚠️ HEAD^1 fallback failed, trying HEAD~1...');
        
        // Try HEAD~1 (first linear parent)
        try {
          const parent = execSync('git rev-parse --verify HEAD~1', {
            encoding: 'utf-8',
            stdio: 'pipe',
          }).trim();
          
          const diff = execSync(`git diff --name-only origin/${base}...${parent}`, {
            encoding: 'utf-8',
            stdio: 'pipe',
          });
          return diff.split('\n').filter(Boolean);
        } catch (fallbackErr2) {
          console.log('⚠️ HEAD~1 also failed. Debugging git state...');
          
          // Debug: show git state
          try {
            console.log('Git log:', execSync('git log --oneline -3', { encoding: 'utf-8', stdio: 'pipe' }));
          } catch (e) {
            console.log('git log failed:', e.message);
          }
          
          try {
            console.log('Git status:', execSync('git status --short', { encoding: 'utf-8', stdio: 'pipe' }));
          } catch (e) {
            console.log('git status failed:', e.message);
          }
          
          // Try to diff against origin directly
          try {
            const originHead = execSync(`git rev-parse origin/${base}`, {
              encoding: 'utf-8',
              stdio: 'pipe',
            }).trim();
            
            console.log(`origin/${base} = ${originHead}`);
            
            const diff = execSync(`git diff --name-only ${originHead}...HEAD`, {
              encoding: 'utf-8',
              stdio: 'pipe',
            });
            return diff.split('\n').filter(Boolean);
          } catch (e) {
            console.log('origin diff also failed:', e.message);
          }
          
          throw new Error('All diff methods exhausted');
        }
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
